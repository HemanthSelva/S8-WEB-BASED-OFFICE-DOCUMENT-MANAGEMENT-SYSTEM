import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Public route (for accepting invitations - no auth needed)
router.post('/accept-invitation', adminController.acceptInvitation);

// All routes below require auth
router.use(requireAuth);

// Admin-only routes
router.post('/invite', requireRole(['ADMIN']), adminController.inviteUser);
router.get('/users', requireRole(['ADMIN', 'MANAGER']), adminController.getUsers);
router.put('/users/:id/role', requireRole(['ADMIN']), adminController.changeUserRole);
router.put('/users/:id/toggle-status', requireRole(['ADMIN']), adminController.toggleUserStatus);
router.get('/invitations', requireRole(['ADMIN']), adminController.getInvitations);
router.get('/stats', requireRole(['ADMIN', 'MANAGER']), adminController.getOrgStats);

// Approval routes (Admin and Manager can view/resolve)
router.get('/approvals', requireRole(['ADMIN', 'MANAGER']), adminController.getApprovals);
router.get('/approvals/pending', requireRole(['ADMIN', 'MANAGER']), adminController.getPendingApprovals);
router.post('/approvals/:id/resolve', requireRole(['ADMIN', 'MANAGER']), adminController.resolveApproval);
router.post('/approvals/request', adminController.requestApproval);

export default router;
