import prisma from '../utils/prisma';
import { DocumentStatus } from '@prisma/client';

import { eventBus, EVENTS } from '../events/eventBus';

export const createDocument = async (
  data: {
    title: string;
    description?: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    ownerId: string;
    organizationId: string;
  },
  filePath?: string
) => {
  const doc = await prisma.document.create({
    data: {
      ...data,
      currentVersion: 1,
      status: DocumentStatus.ACTIVE,
    },
  });

  eventBus.emit(EVENTS.DOCUMENT_UPLOADED, {
      documentId: doc.id,
      userId: data.ownerId,
      organizationId: data.organizationId,
      title: doc.title,
      filePath
  });

  return doc;
};

export const getDocumentById = async (id: string, organizationId: string) => {
  return await prisma.document.findFirst({
    where: {
      id,
      organizationId,
      status: { not: DocumentStatus.DELETED },
    },
    include: {
      metadata: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

import redisClient from '../utils/redis';

export const listDocuments = async (organizationId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const cacheKey = `docs:list:${organizationId}:${page}:${limit}`;
  
  if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
  }

  const [data, total] = await Promise.all([
      prisma.document.findMany({
        where: {
          organizationId,
          status: { not: DocumentStatus.DELETED },
        },
        include: {
          owner: {
            select: { id: true, name: true },
          },
          metadata: true
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.document.count({
          where: {
              organizationId,
              status: { not: DocumentStatus.DELETED },
          }
      })
  ]);
  
  const result = { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  
  if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(result));
  }
  
  return result;
};

export const updateDocument = async (id: string, data: any) => {
  return await prisma.document.update({
    where: { id },
    data,
  });
};

export const deleteDocument = async (id: string) => {
  return await prisma.document.update({
    where: { id },
    data: { status: DocumentStatus.DELETED },
  });
};

export const createMetadata = async (documentId: string, data: any) => {
  return await prisma.documentMetadata.create({
    data: {
      documentId,
      ...data,
      tags: data.tags || [],
    },
  });
};
