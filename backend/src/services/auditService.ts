import prisma from '../utils/prisma';
import { AuditAction } from '@prisma/client';

export const logAction = async (
  actionType: AuditAction,
  userId: string,
  organizationId: string,
  documentId?: string,
  ipAddress?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        actionType,
        userId,
        organizationId,
        documentId,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Non-blocking error handling - don't fail the request if audit logging fails
  }
};

export const getAuditLogs = async (organizationId: string, limit = 50, offset = 0) => {
  return await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: { select: { name: true, email: true } },
      document: { select: { title: true } }
    }
  });
};
