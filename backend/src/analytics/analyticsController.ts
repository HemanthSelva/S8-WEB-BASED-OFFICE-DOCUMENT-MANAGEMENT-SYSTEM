import { Request, Response } from 'express';
import { analyticsService } from './analyticsService';
import { AuthRequest } from '../middleware/auth';

import * as auditService from '../services/auditService';
import prisma from '../utils/prisma';
import { DocumentStatus } from '@prisma/client';

export class AnalyticsController {

    async getAuditLogs(req: AuthRequest, res: Response) {
        try {
            const logs = await auditService.getAuditLogs(req.user!.organizationId);
            res.json(logs);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getOverview(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId;

            // Run in parallel
            const [docs, workflows, users, ai, blockchain, activities] = await Promise.all([
                analyticsService.getDocumentMetrics(orgId),
                analyticsService.getWorkflowMetrics(orgId),
                analyticsService.getUserMetrics(orgId),
                analyticsService.getAIMetrics(orgId),
                analyticsService.getBlockchainMetrics(orgId),
                analyticsService.getGlobalRecentActivity(orgId)
            ]);

            res.json({
                // Explicitly requested root fields for the Admin Dashboard
                totalDocuments: docs.totalDocuments,
                pendingWorkflows: workflows.pendingWorkflows,
                activeUsersDaily: users.dailyActiveUsers[new Date().toISOString().split('T')[0]] || 0,
                documentDistribution: docs.categoryDistribution,
                recentActivity: activities,
                
                // Existing sub-objects
                summary: {
                    totalDocuments: docs.totalDocuments,
                    pendingWorkflows: workflows.pendingWorkflows,
                    activeUsers: users.dailyActiveUsers[new Date().toISOString().split('T')[0]] || 0,
                    blockchainRegistered: blockchain.totalRegisteredOnChain
                },
                docs,
                workflows,
                users,
                ai,
                blockchain
            });
        } catch (error: any) {
            console.error('Analytics Error:', error);
            res.status(500).json({ message: 'Failed to fetch analytics overview' });
        }
    }

    async getDocumentStats(req: AuthRequest, res: Response) {
        try {
            const stats = await analyticsService.getDocumentMetrics(req.user!.organizationId);
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getWorkflowStats(req: AuthRequest, res: Response) {
        try {
            const stats = await analyticsService.getWorkflowMetrics(req.user!.organizationId);
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getUserStats(req: AuthRequest, res: Response) {
        try {
            const stats = await analyticsService.getUserMetrics(req.user!.organizationId);
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getAIStats(req: AuthRequest, res: Response) {
        try {
            const stats = await analyticsService.getAIMetrics(req.user!.organizationId);
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getBlockchainStats(req: AuthRequest, res: Response) {
        try {
            const stats = await analyticsService.getBlockchainMetrics(req.user!.organizationId);
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPersonalOverview(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId;
            const userId = req.user!.userId;

            const personalMetrics = await analyticsService.getPersonalMetrics(userId, orgId);

            // Also include some general org stats for context
            const orgDocs = await prisma.document.count({
                where: { organizationId: orgId, status: { not: DocumentStatus.DELETED } }
            });

            res.json({
                ...personalMetrics,
                orgTotalDocuments: orgDocs
            });
        } catch (error: any) {
            console.error('Personal Analytics Error:', error);
            res.status(500).json({ message: 'Failed to fetch personal dashboard data' });
        }
    }
}

export const analyticsController = new AnalyticsController();
