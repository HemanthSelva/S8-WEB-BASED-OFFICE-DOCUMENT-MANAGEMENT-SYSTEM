import { eventBus, EVENTS } from './eventBus';
import * as notificationService from '../services/notificationService';
import * as activityService from '../services/activityService';
import { aiClientService } from '../services/aiClientService';
import prisma from '../utils/prisma';
import { Role, NotificationType, EntityType, ProcessingStatus } from '@prisma/client';

// Helper to find users by role
const findUsersByRole = async (organizationId: string, role: Role) => {
  return await prisma.user.findMany({
    where: { organizationId, role },
    select: { id: true },
  });
};

// --- Event Handlers ---

eventBus.on(EVENTS.DOCUMENT_UPLOADED, async (data) => {
  const { documentId, userId, organizationId, title, filePath } = data;
  
  // Log Activity
  await activityService.logActivity(
    userId,
    organizationId,
    EntityType.DOCUMENT,
    documentId,
    'UPLOADED',
    { title }
  );

  // Notify Managers
  const managers = await findUsersByRole(organizationId, Role.MANAGER);
  for (const manager of managers) {
    if (manager.id !== userId) { // Don't notify self
      await notificationService.createNotification(
        manager.id,
        organizationId,
        NotificationType.DOCUMENT,
        'New Document Uploaded',
        `A new document "${title}" has been uploaded.`
      );
    }
  }

  // Trigger AI Processing
  if (filePath) {
      eventBus.emit(EVENTS.AI_PROCESS, {
          documentId,
          organizationId,
          filePath
      });
  }
});

eventBus.on(EVENTS.AI_PROCESS, async (data) => {
    const { documentId, organizationId, filePath } = data;
    console.log(`[AI] Starting processing for document ${documentId}`);
    
    try {
        // 1. Set Status to PROCESSING
        await prisma.document.update({
            where: { id: documentId },
            data: { processingStatus: ProcessingStatus.PROCESSING }
        });

        const result = await aiClientService.processDocument(documentId, organizationId, filePath);
        
        // 2. Update Metadata & Status to COMPLETED
        await prisma.document.update({
            where: { id: documentId },
            data: { 
                processingStatus: ProcessingStatus.COMPLETED,
                metadata: {
                    upsert: {
                        create: {
                            department: result.department,
                            category: result.category,
                            tags: result.tags || []
                        },
                        update: {
                            department: result.department,
                            category: result.category,
                            tags: result.tags || []
                        }
                    }
                }
            }
        });

        console.log(`[AI] Processing completed for document ${documentId}`);
        
        // Notify User
        const doc = await prisma.document.findUnique({ where: { id: documentId } });
        if (doc) {
             await notificationService.createNotification(
                doc.ownerId,
                organizationId,
                NotificationType.DOCUMENT,
                'Document Processed',
                `AI processing completed for "${doc.title}".`
            );
        }

    } catch (error) {
        console.error(`[AI] Failed to process document ${documentId}:`, error);
        
        // Set Status to FAILED
        await prisma.document.update({
            where: { id: documentId },
            data: { processingStatus: ProcessingStatus.FAILED }
        });
    }
});

eventBus.on(EVENTS.WORKFLOW_STARTED, async (data) => {
  const { documentId, userId, organizationId, instanceId } = data;
  
  // Log Activity
  await activityService.logActivity(
    userId,
    organizationId,
    EntityType.WORKFLOW,
    instanceId,
    'STARTED',
    { documentId }
  );
});

eventBus.on(EVENTS.WORKFLOW_APPROVED, async (data) => {
  const { documentId, userId, organizationId, instanceId, nextStep } = data;

  await activityService.logActivity(
    userId,
    organizationId,
    EntityType.WORKFLOW,
    instanceId,
    'APPROVED',
    { documentId, nextStep }
  );
});

eventBus.on(EVENTS.WORKFLOW_REJECTED, async (data) => {
  const { documentId, userId, organizationId, instanceId } = data;

  await activityService.logActivity(
    userId,
    organizationId,
    EntityType.WORKFLOW,
    instanceId,
    'REJECTED',
    { documentId }
  );

  // Notify Owner
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (doc) {
      await notificationService.createNotification(
          doc.ownerId,
          organizationId,
          NotificationType.WORKFLOW,
          'Workflow Rejected',
          `Your document "${doc.title}" was rejected.`
      );
  }
});

eventBus.on(EVENTS.WORKFLOW_ESCALATED, async (data) => {
    const { documentId, organizationId, instanceId } = data;

    const admins = await findUsersByRole(organizationId, Role.ADMIN);
    for (const admin of admins) {
        await notificationService.createNotification(
            admin.id,
            organizationId,
            NotificationType.WORKFLOW,
            'Workflow Escalated',
            `Workflow for document ${documentId} has breached SLA.`
        );
    }
});
