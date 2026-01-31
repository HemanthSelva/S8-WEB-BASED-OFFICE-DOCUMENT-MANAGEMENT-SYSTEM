import { Router } from 'express';
import { analyticsController } from './analyticsController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

// Apply Global Security: Auth Required
router.use(requireAuth);

// Apply Role Security: Admin Only for analytics
router.use(requireRole([Role.ADMIN]));

router.get('/overview', analyticsController.getOverview);
router.get('/documents', analyticsController.getDocumentStats);
router.get('/workflows', analyticsController.getWorkflowStats);
router.get('/users', analyticsController.getUserStats);
router.get('/ai', analyticsController.getAIStats);
router.get('/blockchain', analyticsController.getBlockchainStats);
router.get('/audit-logs', analyticsController.getAuditLogs);

export default router;
