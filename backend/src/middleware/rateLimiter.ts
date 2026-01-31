import { Request, Response, NextFunction } from 'express';
import redisClient from '../utils/redis';

const LIMIT = 100; // requests
const WINDOW = 60 * 15; // 15 minutes in seconds

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || 'unknown';
    const key = `rate_limit:${ip}`;
    
    const requests = await redisClient.incr(key);
    
    if (requests === 1) {
      await redisClient.expire(key, WINDOW);
    }
    
    const ttl = await redisClient.ttl(key);

    res.setHeader('X-RateLimit-Limit', LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, LIMIT - requests));
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + ttl);

    if (requests > LIMIT) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    
    next();
  } catch (error) {
    console.error('Rate limiter error', error);
    next(); // Fail open
  }
};
