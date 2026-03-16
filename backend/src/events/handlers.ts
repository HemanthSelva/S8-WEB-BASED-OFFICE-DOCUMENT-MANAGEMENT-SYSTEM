import { eventBus, EVENTS } from './eventBus';
import * as notificationService from '../services/notificationService';
import * as activityService from '../services/activityService';
import prisma from '../utils/prisma';
import { Role, NotificationType, EntityType } from '@prisma/client';

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

  // AI Processing is now exclusively handled by BullMQ worker in documentController
});

eventBus.on(EVENTS.WORKFLOW_STARTED, async (data) => {
  const { documentId, userId, organizationId, instanceId, currentStep } = data;

  // Log Activity
  await activityService.logActivity(
    userId,
    organizationId,
    EntityType.WORKFLOW,
    instanceId,
    'STARTED',
    { documentId }
  );

  // Notify Approvers based on currentStep
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    include: { workflowTemplate: { include: { steps: true } }, document: true }
  });

  if (instance) {
    const step = instance.workflowTemplate.steps.find(s => s.stepOrder === currentStep);
    if (step) {
      const approvers = await findUsersByRole(organizationId, step.roleRequired);
      for (const approver of approvers) {
        await notificationService.createNotification(
          approver.id,
          organizationId,
          NotificationType.WORKFLOW,
          'Action Required: Document Approval',
          `A new document "${instance.document.title}" requires your approval (${step.roleRequired}).`
        );
      }
    }
  }
});

eventBus.on(EVENTS.WORKFLOW_APPROVED, async (data) => {
  const { documentId, userId, organizationId, instanceId, nextStep, ownerId, nextRole } = data;

  await activityService.logActivity(
    userId,
    organizationId,
    EntityType.WORKFLOW,
    instanceId,
    'APPROVED',
    { documentId, nextStep }
  );

  // 1. Notify Next Approver if exists
  if (nextStep && nextRole) {
    const approvers = await findUsersByRole(organizationId, nextRole);
    for (const approver of approvers) {
      await notificationService.createNotification(
        approver.id,
        organizationId,
        NotificationType.WORKFLOW,
        'Action Required: Document Approval',
        `A document requires your approval step.`
      );
    }
  }

  // 2. Notify Owner (Instant Notification)
  if (ownerId) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    await notificationService.createNotification(
      ownerId,
      organizationId,
      NotificationType.WORKFLOW,
      'Document Approved',
      nextStep
        ? `Your document "${doc?.title}" has been approved at the current level.`
        : `Congratulations! Your document "${doc?.title}" has been fully APPROVED.`
    );
  }
});

eventBus.on(EVENTS.WORKFLOW_REJECTED, async (data) => {
  const { documentId, userId, organizationId, instanceId, ownerId } = data;

  await activityService.logActivity(
    userId,
    organizationId,
    EntityType.WORKFLOW,
    instanceId,
    'REJECTED',
    { documentId }
  );

  // Notify Owner (Instant Notification)
  if (ownerId) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    await notificationService.createNotification(
      ownerId,
      organizationId,
      NotificationType.WORKFLOW,
      'Document Rejected',
      `Your document "${doc?.title}" was REJECTED.`
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
