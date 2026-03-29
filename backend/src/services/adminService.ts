import prisma from '../utils/prisma';
import { hashPassword } from '../utils/password';
import { Role, UserStatus, InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../utils/logger';

/**
 * Invite a new user to the organization
 */
export const inviteUser = async (data: {
  email: string;
  name: string;
  role: Role;
  invitedById: string;
  organizationId: string;
}) => {
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  // Check if pending invitation exists
  const existingInvite = await prisma.userInvitation.findFirst({
    where: { email: data.email, status: 'PENDING', organizationId: data.organizationId }
  });
  if (existingInvite) {
    throw new Error('A pending invitation already exists for this email');
  }

  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

  const invitation = await prisma.userInvitation.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      invitedById: data.invitedById,
      organizationId: data.organizationId,
      token,
      expiresAt,
    },
    include: {
      invitedBy: { select: { name: true, email: true } },
      organization: { select: { name: true } },
    }
  });

  Logger.info(`[AdminService] User invitation created for ${data.email} by ${data.invitedById}`);
  return invitation;
};

/**
 * Accept an invitation and create the user account
 */
export const acceptInvitation = async (token: string, password: string) => {
  const invitation = await prisma.userInvitation.findUnique({ where: { token } });

  if (!invitation) throw new Error('Invalid invitation token');
  if (invitation.status !== 'PENDING') throw new Error('Invitation already used or expired');
  if (new Date() > invitation.expiresAt) {
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' }
    });
    throw new Error('Invitation has expired');
  }

  const hashedPassword = await hashPassword(password);

  // Transaction: create user + update invitation
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: invitation.name,
        email: invitation.email,
        passwordHash: hashedPassword,
        role: invitation.role,
        organizationId: invitation.organizationId,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, name: true, email: true, role: true, organizationId: true, status: true, createdAt: true },
    }),
    prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    })
  ]);

  Logger.info(`[AdminService] Invitation accepted, user created: ${user.id}`);
  return user;
};

/**
 * Get all users for organization with activity stats
 */
export const getUsersWithStats = async (organizationId: string) => {
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          documents: true,
          auditLogs: true,
          loginHistory: true,
        }
      },
      loginHistory: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: { timestamp: true, ipAddress: true, success: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return users.map(u => ({
    ...u,
    lastLogin: u.loginHistory[0] || null,
    stats: {
      documentsUploaded: u._count.documents,
      totalActions: u._count.auditLogs,
      totalLogins: u._count.loginHistory,
    },
    loginHistory: undefined,
    _count: undefined,
  }));
};

/**
 * Get all pending invitations for organization
 */
export const getInvitations = async (organizationId: string) => {
  return prisma.userInvitation.findMany({
    where: { organizationId },
    include: {
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Change user role (Admin only)
 */
export const changeUserRole = async (userId: string, newRole: Role, organizationId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId }
  });
  if (!user) throw new Error('User not found in this organization');

  return prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true, status: true }
  });
};

/**
 * Suspend or reactivate a user
 */
export const toggleUserStatus = async (userId: string, organizationId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId }
  });
  if (!user) throw new Error('User not found in this organization');

  const newStatus = user.status === 'ACTIVE' ? UserStatus.SUSPENDED : UserStatus.ACTIVE;

  return prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
    select: { id: true, name: true, email: true, role: true, status: true }
  });
};

/**
 * Get organization stats for admin dashboard
 */
export const getOrgStats = async (organizationId: string) => {
  const [userCount, docCount, activeWorkflows, pendingApprovals, storageResult] = await Promise.all([
    prisma.user.count({ where: { organizationId } }),
    prisma.document.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.workflowInstance.count({ where: { status: 'PENDING', template: { organizationId } } }),
    prisma.actionApproval.count({ where: { organizationId, status: 'PENDING_APPROVAL' } }),
    prisma.document.aggregate({
      where: { organizationId, status: 'ACTIVE' },
      _sum: { fileSize: true }
    }),
  ]);

  return {
    totalUsers: userCount,
    totalDocuments: docCount,
    activeWorkflows,
    pendingApprovals,
    storageUsedBytes: storageResult._sum.fileSize || 0,
  };
};
