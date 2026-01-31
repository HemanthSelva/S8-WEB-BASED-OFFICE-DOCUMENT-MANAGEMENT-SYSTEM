import prisma from '../utils/prisma';
import redisClient from '../utils/redis';
import { DocumentStatus, WorkflowStatus, ApprovalActionType } from '@prisma/client';

const CACHE_TTL = 300; // 5 minutes

export class AnalyticsService {
    
    private async getOrSetCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        if (!redisClient.isOpen) return await fetchFn();

        const cached = await redisClient.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        const data = await fetchFn();
        await redisClient.setEx(key, CACHE_TTL, JSON.stringify(data));
        return data;
    }

    async getDocumentMetrics(organizationId: string) {
        return this.getOrSetCache(`analytics:docs:${organizationId}`, async () => {
            const totalDocs = await prisma.document.count({
                where: { organizationId, status: { not: DocumentStatus.DELETED } }
            });

            const storageStats = await prisma.document.aggregate({
                where: { organizationId, status: { not: DocumentStatus.DELETED } },
                _sum: { fileSize: true }
            });

            const totalVersions = await prisma.documentVersion.count({
                where: { document: { organizationId } }
            });

            // Uploads trends - last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const uploads = await prisma.document.groupBy({
                by: ['createdAt'],
                where: { 
                    organizationId,
                    createdAt: { gte: sevenDaysAgo }
                },
                _count: { id: true }
            });

            // Group by day manually since Prisma groupBy returns Date objects
            const trendMap: Record<string, number> = {};
            uploads.forEach(u => {
                const day = u.createdAt.toISOString().split('T')[0];
                trendMap[day] = (trendMap[day] || 0) + u._count.id;
            });

            return {
                totalDocuments: totalDocs,
                totalStorageBytes: storageStats._sum.fileSize || 0,
                averageVersions: totalDocs > 0 ? Number((totalVersions / totalDocs).toFixed(1)) : 0,
                uploadTrend: trendMap
            };
        });
    }

    async getWorkflowMetrics(organizationId: string) {
        return this.getOrSetCache(`analytics:workflows:${organizationId}`, async () => {
            const pendingCount = await prisma.workflowInstance.count({
                where: { 
                    document: { organizationId },
                    status: WorkflowStatus.PENDING
                }
            });

            const slaBreaches = await prisma.workflowInstance.count({
                where: { 
                    document: { organizationId },
                    status: WorkflowStatus.ESCALATED
                }
            });

            const actions = await prisma.approvalAction.groupBy({
                by: ['action'],
                where: { workflowInstance: { document: { organizationId } } },
                _count: { id: true }
            });

            const approvedCount = actions.find(a => a.action === ApprovalActionType.APPROVE)?._count.id || 0;
            const rejectedCount = actions.find(a => a.action === ApprovalActionType.REJECT)?._count.id || 0;
            const totalActions = approvedCount + rejectedCount;

            // Average Approval Time (Completed workflows)
            const completedWorkflows = await prisma.workflowInstance.findMany({
                where: {
                    document: { organizationId },
                    status: { in: [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED] },
                    completedAt: { not: null }
                },
                select: { startedAt: true, completedAt: true }
            });

            let totalTimeMs = 0;
            completedWorkflows.forEach(wf => {
                if (wf.completedAt) {
                    totalTimeMs += (wf.completedAt.getTime() - wf.startedAt.getTime());
                }
            });

            const avgTimeHours = completedWorkflows.length > 0 
                ? (totalTimeMs / completedWorkflows.length) / (1000 * 60 * 60) 
                : 0;

            return {
                pendingWorkflows: pendingCount,
                slaBreaches,
                approvalRate: totalActions > 0 ? Number((approvedCount / totalActions * 100).toFixed(1)) : 0,
                rejectionRate: totalActions > 0 ? Number((rejectedCount / totalActions * 100).toFixed(1)) : 0,
                avgCompletionTimeHours: Number(avgTimeHours.toFixed(2))
            };
        });
    }

    async getUserMetrics(organizationId: string) {
        return this.getOrSetCache(`analytics:users:${organizationId}`, async () => {
            // Most active users
            const activeUsers = await prisma.activityLog.groupBy({
                by: ['actorId'],
                where: { organizationId },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            });

            // Need to fetch user details manually
            const userIds = activeUsers.map(u => u.actorId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, email: true }
            });

            const topUsers = activeUsers.map(u => {
                const user = users.find(usr => usr.id === u.actorId);
                return {
                    name: user?.name || 'Unknown',
                    email: user?.email || '',
                    actionCount: u._count.id
                };
            });

            // Actions per Department
            // Since User model doesn't strictly link to Department (it's in Metadata), we infer from Metadata via Document actions if possible,
            // but ActivityLog links to Actor. Actor -> User -> Organization.
            // Department info is on DocumentMetadata.
            // Simplified: Group documents by department and count actions on them?
            // Or just return upload counts by department.
            
            // Let's do: Document count by department
            // This is actually a document metric but fits "department activity"
            const docsByDept = await prisma.documentMetadata.groupBy({
                by: ['department'],
                where: { document: { organizationId } },
                _count: { documentId: true }
            });
            
            const departmentStats = docsByDept.reduce((acc: Record<string, number>, curr) => {
                if (curr.department) {
                    acc[curr.department] = curr._count.documentId;
                }
                return acc;
            }, {});

            // Daily Active Users (Last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Prisma doesn't support distinct count in groupBy easily for DAU logic in one query.
            // We'll approximate by counting unique actorIds per day from activity logs.
            const logs = await prisma.activityLog.findMany({
                where: { 
                    organizationId,
                    createdAt: { gte: sevenDaysAgo }
                },
                select: { actorId: true, createdAt: true }
            });

            const dauMap: Record<string, Set<string>> = {};
            logs.forEach(log => {
                const day = log.createdAt.toISOString().split('T')[0];
                if (!dauMap[day]) dauMap[day] = new Set();
                dauMap[day].add(log.actorId);
            });

            const dauStats: Record<string, number> = {};
            Object.keys(dauMap).forEach(day => {
                dauStats[day] = dauMap[day].size;
            });

            return {
                topActiveUsers: topUsers,
                departmentStats,
                dailyActiveUsers: dauStats
            };
        });
    }

    async getAIMetrics(organizationId: string) {
        return this.getOrSetCache(`analytics:ai:${organizationId}`, async () => {
            const indexedDocs = await prisma.documentMetadata.count({
                where: { document: { organizationId } }
            });

            // Assuming all indexed docs underwent OCR/AI processing
            // In a real system we'd track processing events specifically.
            
            // We can also count specific tags distribution
            // Limitation: Prisma doesn't easily unroll array fields for aggregation (tags).
            
            return {
                documentsIndexed: indexedDocs,
                ocrProcessedCount: indexedDocs, // Approximation
            };
        });
    }

    async getBlockchainMetrics(organizationId: string) {
        return this.getOrSetCache(`analytics:blockchain:${organizationId}`, async () => {
            const registeredCount = await prisma.documentVersion.count({
                where: { 
                    document: { organizationId },
                    blockchainTxHash: { not: null }
                }
            });

            const verifiedDocs = await prisma.document.count({
                where: { 
                    organizationId,
                    lastVerifiedAt: { not: null }
                }
            });

            const latestActivity = await prisma.documentVersion.findMany({
                where: { 
                    document: { organizationId },
                    blockchainTxHash: { not: null }
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { document: { select: { title: true } } }
            });

            return {
                totalRegisteredOnChain: registeredCount,
                verifiedDocumentsCount: verifiedDocs,
                latestActivity: latestActivity.map(v => ({
                    document: v.document.title,
                    txHash: v.blockchainTxHash,
                    timestamp: v.createdAt
                }))
            };
        });
    }
}

export const analyticsService = new AnalyticsService();
