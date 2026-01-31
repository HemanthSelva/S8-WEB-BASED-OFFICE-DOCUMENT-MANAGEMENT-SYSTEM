import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const documentQueue = new Queue('document-processing', { connection });

export const addDocumentJob = async (documentId: string, filePath: string, organizationId: string) => {
  await documentQueue.add('process-document', {
    documentId,
    filePath,
    organizationId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });
};
