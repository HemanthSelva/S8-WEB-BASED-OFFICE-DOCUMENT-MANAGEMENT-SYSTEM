import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/mark-all-read', notificationController.markAllAsRead);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.get('/activities', notificationController.getActivities);

export default router;
