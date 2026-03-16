import prisma from '../utils/prisma';
import { DocumentStatus } from '@prisma/client';

import { eventBus, EVENTS } from '../events/eventBus';
import redisClient from '../utils/redis';

const invalidateCache = async (organizationId: string) => {
  if (redisClient.isOpen) {
    const pattern = `docs:list:${organizationId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
};

export const createDocument = async (
  data: {
    title: string;
    description?: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    ownerId: string;
    organizationId: string;
    extractedText?: string;
    category?: string;
    confidence?: number;
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

  await invalidateCache(data.organizationId);

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

export const listDocuments = async (organizationId: string, page: number = 1, limit: number = 20, filters?: { category?: string, department?: string }) => {
  const skip = (page - 1) * limit;
  const cacheKey = `docs:list:${organizationId}:${page}:${limit}:${filters?.category || 'all'}:${filters?.department || 'all'}`;

  if (redisClient.isOpen) {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('[Cache] Serving from cache:', cacheKey);
      return JSON.parse(cached);
    }
  }

  const whereClause: any = {
    organizationId,
    status: { not: DocumentStatus.DELETED },
  };

  if (filters?.category) {
    whereClause.category = filters.category;
  }

  if (filters?.department) {
    whereClause.metadata = {
      department: filters.department
    };
  }

  const [data, total] = await Promise.all([
    prisma.document.findMany({
      where: whereClause,
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
      where: whereClause
    })
  ]);

  const result = { data, total, page, limit, totalPages: Math.ceil(total / limit) };

  if (redisClient.isOpen) {
    await redisClient.setEx(cacheKey, 60, JSON.stringify(result));
  }

  return result;
};

export const updateDocument = async (id: string, data: any) => {
  const doc = await prisma.document.update({
    where: { id },
    data,
  });

  await invalidateCache(doc.organizationId);
  return doc;
};

export const deleteDocument = async (id: string) => {
  const doc = await prisma.document.update({
    where: { id },
    data: { status: DocumentStatus.DELETED },
  });

  await invalidateCache(doc.organizationId);
  return doc;
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
