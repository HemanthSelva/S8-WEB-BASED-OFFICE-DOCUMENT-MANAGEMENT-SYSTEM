import { Worker } from 'bullmq';
import { aiClientService } from '../services/aiClientService';
import * as workflowService from '../services/workflowService';
import prisma from '../utils/prisma';
import Logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const documentWorker = new Worker('document-processing', async job => {
  const { documentId, filePath, organizationId, title, fileName } = job.data;
  Logger.info(`[Worker] Processing document ${documentId}`);

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'PROCESSING' }
    });

    // Call AI Service
    const t0 = Date.now();
    const result = await aiClientService.processDocument(documentId, organizationId, filePath, title, fileName);
    Logger.info(`[Worker] AI Processing took: ${(Date.now() - t0) / 1000}s`);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: 'COMPLETED'
      }
    });

    // Update Metadata
    const t1 = Date.now();
    await prisma.documentMetadata.upsert({
      where: { documentId },
      create: {
        documentId,
        department: result.department,
        category: result.category,
        tags: result.tags,
        customFields: result.extractedData
      },
      update: {
        department: result.department === 'General' ? undefined : result.department,
        category: result.category === 'Uncategorized' ? undefined : result.category,
        tags: result.tags,
        customFields: result.extractedData
      }
    });
    Logger.info(`[Worker] Metadata update took: ${(Date.now() - t1) / 1000}s`);

    // Also update document's category and confidence if available
    await prisma.document.update({
      where: { id: documentId },
      data: {
        category: result.category,
        confidence: result.confidence
      }
    });

    // Trigger Workflow based on final category
    try {
      let templateName = 'Standard Approval Process';
      if (result.category?.toUpperCase() === 'INVOICE') templateName = 'Invoice Approval';
      if (result.category?.toUpperCase() === 'CONTRACT') templateName = 'Contract Review';

      let template = await workflowService.getTemplateByName(templateName, organizationId);

      // Fallback if specific template not found
      if (!template && templateName !== 'Standard Approval Process') {
        Logger.info(`[Worker] Specific template '${templateName}' not found, falling back to 'Standard Approval Process'`);
        template = await workflowService.getTemplateByName('Standard Approval Process', organizationId);
      }

      if (template) {
        // We need a userId to start workflow. Using ownerId from document.
        const doc = await prisma.document.findUnique({ where: { id: documentId } });
        if (doc) {
          await workflowService.startWorkflow(documentId, template.id, doc.ownerId, organizationId);
          Logger.info(`[Worker] Auto-started workflow '${template.name}' for document ${documentId}`);
        }
      }
    } catch (e) {
      Logger.error(`[Worker] Failed to auto-start workflow for document ${documentId}: ${e}`);
    }

    Logger.info(`[Worker] Document ${documentId} processed successfully`);
  } catch (error: any) {
    Logger.error(`[Worker] Failed to process document ${documentId}: ${error.message}`);
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'FAILED' }
    });
    // Do not re-throw to prevent crash loop. Job is marked as failed by logging.
    // throw error;
  }
}, { connection });
