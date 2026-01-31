import prisma from '../utils/prisma';
import { broadcastToOrg } from '../sockets/socketServer';
import { EntityType } from '@prisma/client';

export const logActivity = async (
  actorId: string,
  organizationId: string,
  entityType: EntityType,
  entityId: string,
  action: string,
  metadata?: any
) => {
  const activity = await prisma.activityLog.create({
    data: {
      actorId,
      organizationId,
      entityType,
      entityId,
      action,
      metadata: metadata || {},
    },
    include: {
      actor: { select: { id: true, name: true } },
    },
  });

  broadcastToOrg(organizationId, 'ACTIVITY_UPDATE', activity);
  return activity;
};

export const getActivities = async (organizationId: string) => {
  return await prisma.activityLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { id: true, name: true } },
    },
  });
};
