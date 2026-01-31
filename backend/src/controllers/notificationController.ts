import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';
import * as activityService from '../services/activityService';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const notifications = await notificationService.getNotifications(user.userId);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await notificationService.markAsRead(id, user.userId);
    res.json({ message: 'Marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const activities = await activityService.getActivities(user.organizationId);
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
