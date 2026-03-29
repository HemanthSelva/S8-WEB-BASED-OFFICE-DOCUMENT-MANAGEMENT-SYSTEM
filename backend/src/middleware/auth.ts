import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import redisClient from '../utils/redis';

export interface AuthRequest extends Request {
  user?: any;
  file?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[AuthMiddleware] Missing or invalid Authorization header:', authHeader);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token revoken' });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = decoded;
    console.log('[AuthMiddleware] User authenticated:', req.user?.email);
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
