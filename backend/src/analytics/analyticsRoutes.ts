import { Router } from 'express';
import { analyticsController } from './analyticsController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

// Middleware now handled in app.ts
// router.use(requireAuth);
// router.use(tenantMiddleware);

router.get('/me', analyticsController.getPersonalOverview);

// Apply Role Security: Admin/Manager Only for the rest
router.use(requireRole([Role.ADMIN, Role.MANAGER]));

router.get('/overview', analyticsController.getOverview);
router.get('/documents', analyticsController.getDocumentStats);
router.get('/workflows', analyticsController.getWorkflowStats);
router.get('/users', analyticsController.getUserStats);
router.get('/ai', analyticsController.getAIStats);
router.get('/blockchain', analyticsController.getBlockchainStats);
router.get('/audit-logs', analyticsController.getAuditLogs);

export default router;
