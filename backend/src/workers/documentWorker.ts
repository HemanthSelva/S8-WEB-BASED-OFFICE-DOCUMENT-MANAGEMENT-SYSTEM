import { Worker } from 'bullmq';
import { aiClientService } from '../services/aiClientService';
import * as documentService from '../services/documentService';
import * as workflowService from '../services/workflowService';
import prisma from '../utils/prisma';
import Logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

import redisClient from '../utils/redis';

export let documentWorker: Worker | null = null;

setTimeout(() => {
  if (redisClient.isOpen) {
    documentWorker = new Worker('document-processing', async job => {
      const { documentId, filePath, organizationId, title, fileName } = job.data;
      Logger.info(`[Worker] Processing document ${documentId}`);

      try {
        await prisma.document.update({
          where: { id: documentId },
          data: { processingStatus: 'PROCESSING' }
        });

        // Call AI Service for core extraction & indexing
        const t0 = Date.now();
        const result = await aiClientService.processDocument(documentId, organizationId, filePath, title, fileName);
        Logger.info(`[Worker] Core AI Processing took: ${(Date.now() - t0) / 1000}s`);

        // Run Advanced AI Suite in parallel
        const tAiSuite = Date.now();
        const [summaryResult, complianceResult, aiDetectResult, relationshipsResult] = await Promise.all([
          aiClientService.summarize(documentId, organizationId, title),
          aiClientService.checkCompliance(documentId, organizationId, result.category),
          aiClientService.detectAi(documentId, organizationId),
          aiClientService.getRelationships(documentId, organizationId, 5)
        ]);
        Logger.info(`[Worker] Advanced AI Suite took: ${(Date.now() - tAiSuite) / 1000}s`);

        await documentService.updateDocument(documentId, {
          processingStatus: 'COMPLETED',
          category: result.category,
          confidence: result.confidence
        });

        // Update Metadata with all AI insights
        const t1 = Date.now();
        const richMetadata = {
          ...(result.extractedData || {}),
          aiSummary: summaryResult,
          aiCompliance: complianceResult,
          aiDetector: aiDetectResult,
          relatedDocuments: relationshipsResult
        };

        await prisma.documentMetadata.upsert({
          where: { documentId },
          create: {
            documentId,
            department: result.department,
            category: result.category,
            tags: result.tags,
            customFields: richMetadata
          },
          update: {
            department: result.department === 'General' ? undefined : result.department,
            category: result.category === 'Uncategorized' ? undefined : result.category,
            tags: result.tags,
            customFields: richMetadata
          }
        });
        Logger.info(`[Worker] Metadata update took: ${(Date.now() - t1) / 1000}s`);

        // Trigger Workflow based on final category
        try {
          let templateName = 'Standard Approval Process';
          const normalizedCategory = result.category?.toUpperCase() || 'GENERAL';
          
          if (normalizedCategory === 'INVOICE') templateName = 'Invoice Approval';
          else if (normalizedCategory === 'CONTRACT' || normalizedCategory === 'AGREEMENT') templateName = 'Contract Review';
          else if (normalizedCategory === 'HR' || normalizedCategory === 'POLICY') templateName = 'HR Policy Approval';

          let template = await workflowService.getTemplateByName(templateName, organizationId);
          
          // Fallback if specific template not found
          if (!template && templateName !== 'Standard Approval Process') {
            Logger.info(`[Worker] Specific template '${templateName}' not found, falling back to 'Standard Approval Process'`);
            template = await workflowService.getTemplateByName('Standard Approval Process', organizationId);
          }

          if (template) {
            const doc = await prisma.document.findUnique({ where: { id: documentId } });
            if (doc) {
              // Ensure we don't start duplicate workflows
              const existing = await prisma.workflowInstance.findFirst({
                where: { documentId, templateId: template.id }
              });
              
              if (!existing) {
                await workflowService.startWorkflow(documentId, template.id, doc.ownerId, organizationId);
                Logger.info(`[Worker] Auto-started workflow '${template.name}' for document ${documentId}`);
              } else {
                Logger.info(`[Worker] Workflow already exists for document ${documentId}, skipping auto-trigger.`);
              }
            }
          }
        } catch (e) {
          Logger.error(`[Worker] Failed to auto-start workflow for document ${documentId}: ${e}`);
        }

        Logger.info(`[Worker] Document ${documentId} processed successfully`);
      } catch (error: any) {
        Logger.error(`[Worker] Failed to process document ${documentId}: ${error.message}`);
        await documentService.updateDocument(documentId, {
          processingStatus: 'FAILED'
        });
        // Do not re-throw to prevent crash loop. Job is marked as failed by logging.
      }
    }, { connection });
    
    documentWorker.on('error', err => {
      Logger.error(`[Worker] Worker error (handled gracefully): ${err.message}`);
    });
    Logger.info('[Worker] BullMQ Worker started successfully');
  } else {
    Logger.warn('[Worker] Redis is unavailable. BullMQ Document Worker is DISABLED.');
  }
}, 2000);
