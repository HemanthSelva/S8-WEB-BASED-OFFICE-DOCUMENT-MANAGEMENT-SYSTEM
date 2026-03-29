import { Router } from 'express';
import { analyticsController } from '../analytics/analyticsController';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();
router.use(requireRole([Role.ADMIN, Role.MANAGER]));
router.get('/', analyticsController.getAuditLogs);

export default router;
