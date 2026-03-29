import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as auditService from '../services/auditService';
import { LoginSchema } from '../utils/validation';
import { AuditAction } from '@prisma/client';
import prisma from '../utils/prisma';

/**
 * Login user and issue tokens
 * @route POST /auth/login
 */
export const login = async (req: Request, res: Response) => {
  const data = LoginSchema.parse(req.body);
  const ip = req.ip || 'unknown';
  try {
    console.log(`[LOGIN ATTEMPT] Email: ${data.email}`);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await authService.login(data.email, data.password, ip, userAgent);
    console.log(`[LOGIN SUCCESS] User: ${data.email}`);
    
    // Audit log
    await auditService.logAction(
      AuditAction.LOGIN,
      result.user.id,
      result.user.organizationId,
      undefined,
      req.ip
    );

    res.json(result);
  } catch (error: any) {
    console.error(`[LOGIN FAILED] Error: ${error.message}`);
    
    // Attempt to log failed login if the user actually exists
    try {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (user) {
            await auditService.logAction(
                AuditAction.FAILED_LOGIN,
                user.id,
                user.organizationId,
                undefined,
                req.ip
            );
        }
    } catch (e) {
        // Ignore errors during failed login audit attempt
    }

    res.status(401).json({ message: error.message });
  }
};

/**
 * Refresh access token using refresh token
 * @route POST /auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
    
    const ip = req.ip || 'unknown';
    const result = await authService.refresh(refreshToken, ip);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

/**
 * Logout user and revoke token
 * @route POST /auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        await authService.logout(token);
    }
    if (req.body.refreshToken) {
        await authService.revokeSession(req.body.refreshToken);
    }
    res.status(200).json({ message: 'Logged out' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
