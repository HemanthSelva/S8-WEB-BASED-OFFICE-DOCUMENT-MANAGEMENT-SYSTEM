import prisma from '../utils/prisma';
import { ApprovalType, EntityType, RequestStatus } from '@prisma/client';
import Logger from '../utils/logger';
import * as documentService from './documentService';

/**
 * Request approval for a destructive action
 */
export const requestApproval = async (data: {
  actionType: ApprovalType;
  entityType: EntityType;
  entityId: string;
  requestedById: string;
  organizationId: string;
  reason?: string;
  metadata?: any;
}) => {
  // Check for duplicate pending requests
  const existing = await prisma.actionApproval.findFirst({
    where: {
      entityId: data.entityId,
      actionType: data.actionType,
      status: 'PENDING_APPROVAL',
      organizationId: data.organizationId,
    }
  });

  if (existing) {
    throw new Error('A pending approval request already exists for this action');
  }

  const approval = await prisma.actionApproval.create({
    data: {
      actionType: data.actionType,
      entityType: data.entityType,
      entityId: data.entityId,
      requestedById: data.requestedById,
      organizationId: data.organizationId,
      reason: data.reason,
      metadata: data.metadata,
    },
    include: {
      requestedBy: { select: { name: true, email: true } },
    }
  });

  Logger.info(`[ApprovalService] Approval requested: ${data.actionType} on ${data.entityType}:${data.entityId} by ${data.requestedById}`);
  return approval;
};

/**
 * Resolve (approve/reject) a pending approval
 */
export const resolveApproval = async (
  approvalId: string,
  action: 'APPROVED_ACTION' | 'REJECTED_ACTION',
  resolvedById: string,
  organizationId: string,
  comment?: string
) => {
  const approval = await prisma.actionApproval.findFirst({
    where: { id: approvalId, organizationId, status: 'PENDING_APPROVAL' }
  });

  if (!approval) throw new Error('Approval request not found or already resolved');

  // Prevent self-approval
  if (approval.requestedById === resolvedById) {
    throw new Error('You cannot approve your own request');
  }

  // Update approval status
  const updated = await prisma.actionApproval.update({
    where: { id: approvalId },
    data: {
      status: action,
      approvedById: resolvedById,
      resolvedAt: new Date(),
      reason: comment || approval.reason,
    },
    include: {
      requestedBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
    }
  });

  // If approved, execute the action
  if (action === 'APPROVED_ACTION') {
    await executeApprovedAction(approval);
  }

  Logger.info(`[ApprovalService] Approval ${action} for ${approval.actionType} on ${approval.entityId} by ${resolvedById}`);
  return updated;
};

/**
 * Execute the approved action
 */
const executeApprovedAction = async (approval: {
  actionType: ApprovalType;
  entityType: EntityType;
  entityId: string;
  organizationId: string;
}) => {
  try {
    switch (approval.actionType) {
      case 'DELETE_DOCUMENT':
        await documentService.deleteDocument(approval.entityId);
        Logger.info(`[ApprovalService] Document ${approval.entityId} deleted after approval`);
        break;

      case 'ARCHIVE_DOCUMENT':
        await documentService.updateDocument(approval.entityId, { status: 'ARCHIVED' });
        Logger.info(`[ApprovalService] Document ${approval.entityId} archived after approval`);
        break;

      case 'DELETE_USER':
        await prisma.user.update({
          where: { id: approval.entityId },
          data: { status: 'SUSPENDED' } // Soft-delete: suspend instead of hard delete
        });
        Logger.info(`[ApprovalService] User ${approval.entityId} suspended after approval`);
        break;

      case 'CHANGE_ROLE':
        // metadata should contain { newRole: 'MANAGER' }
        const metadata = approval as any;
        if (metadata.metadata?.newRole) {
          await prisma.user.update({
            where: { id: approval.entityId },
            data: { role: metadata.metadata.newRole }
          });
          Logger.info(`[ApprovalService] User ${approval.entityId} role changed after approval`);
        }
        break;

      default:
        Logger.warn(`[ApprovalService] Unknown action type: ${approval.actionType}`);
    }
  } catch (error) {
    Logger.error(`[ApprovalService] Failed to execute approved action: ${error}`);
    throw error;
  }
};

/**
 * Get pending approvals for an organization
 */
export const getPendingApprovals = async (organizationId: string) => {
  return prisma.actionApproval.findMany({
    where: { organizationId, status: 'PENDING_APPROVAL' },
    include: {
      requestedBy: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get all approvals for an organization (with pagination)
 */
export const getAllApprovals = async (organizationId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.actionApproval.findMany({
      where: { organizationId },
      include: {
        requestedBy: { select: { name: true, email: true, role: true } },
        approvedBy: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.actionApproval.count({ where: { organizationId } })
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
};
