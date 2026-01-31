import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const tenantMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!req.user.organizationId) {
    return res.status(403).json({ message: 'User does not belong to an organization' });
  }

  // Future: Check if organization is active/suspended
  // Future: Check subdomain matching

  next();
};
