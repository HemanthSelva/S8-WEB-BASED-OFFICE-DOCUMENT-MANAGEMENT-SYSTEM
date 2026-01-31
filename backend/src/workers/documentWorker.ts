import { Worker } from 'bullmq';
import { aiClientService } from '../services/aiClientService';
import prisma from '../utils/prisma';
import Logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const documentWorker = new Worker('document-processing', async job => {
  const { documentId, filePath, organizationId } = job.data;
  Logger.info(`[Worker] Processing document ${documentId}`);

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'PROCESSING' }
    });

    // Call AI Service
    const result = await aiClientService.processDocument(documentId, organizationId, filePath);

    await prisma.document.update({
      where: { id: documentId },
      data: { 
        processingStatus: 'COMPLETED'
      }
    });
    
    // Update Metadata
    await prisma.documentMetadata.upsert({
        where: { documentId },
        create: {
            documentId,
            department: result.department,
            category: result.category,
            tags: result.tags,
        },
        update: {
            department: result.department,
            category: result.category,
            tags: result.tags
        }
    });

    Logger.info(`[Worker] Document ${documentId} processed successfully`);
  } catch (error: any) {
    Logger.error(`[Worker] Failed to process document ${documentId}: ${error.message}`);
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'FAILED' }
    });
    throw error;
  }
}, { connection });
