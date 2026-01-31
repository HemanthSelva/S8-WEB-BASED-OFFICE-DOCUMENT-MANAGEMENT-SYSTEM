import prisma from '../utils/prisma';
import { comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import redisClient from '../utils/redis';
import Logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const login = async (email: string, password: string, ipAddress: string, userAgent: string) => {
  Logger.info(`[AuthService] Login attempt for: ${email}`);
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    Logger.warn(`[AuthService] User not found: ${email}`);
    // Log failed attempt if possible, but we don't have user ID
    throw new Error('Invalid credentials');
  }

  if (user.status !== 'ACTIVE') {
    Logger.warn(`[AuthService] User inactive: ${email}`);
    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent, success: false }
    });
    throw new Error('Account suspended');
  }

  const isValid = await comparePassword(password, user.passwordHash);
  
  if (!isValid) {
    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent, success: false }
    });
    throw new Error('Invalid credentials');
  }

  // Log success
  await prisma.loginHistory.create({
    data: { userId: user.id, ipAddress, userAgent, success: true }
  });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };

  const accessToken = signAccessToken(payload);
  const refreshTokenString = signRefreshToken(payload);

  // Store refresh token in DB
  // Calculate expiry date based on 7 days (should match JWT expiry)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt
    }
  });

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken: refreshTokenString };
};

export const refresh = async (token: string, ipAddress: string) => {
  // 1. Verify JWT signature
  const decoded = verifyRefreshToken(token) as any;
  if (!decoded) {
    throw new Error('Invalid refresh token');
  }

  // 2. Check DB for token status
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!storedToken) {
    // Token reuse detection could happen here (if we tracked families)
    throw new Error('Invalid refresh token');
  }

  if (storedToken.revoked) {
    // Security alert: Revoked token usage attempt
    Logger.warn(`[AuthService] Attempt to use revoked token by user ${storedToken.userId}`);
    throw new Error('Token revoked');
  }

  if (new Date() > storedToken.expiresAt) {
    throw new Error('Token expired');
  }

  const user = storedToken.user;
  if (user.status !== 'ACTIVE') {
    throw new Error('User inactive');
  }

  // 3. Rotate Token
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };

  const newAccessToken = signAccessToken(payload);
  const newRefreshTokenString = signRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Transaction: Revoke old, create new
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true, replacedByToken: newRefreshTokenString }
    }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshTokenString,
        userId: user.id,
        expiresAt
      }
    })
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshTokenString };
};

export const logout = async (token: string) => {
  // Revoke in DB
  try {
    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true }
    });
  } catch (e) {
    // Token might not exist in DB if it was just a random string
  }
  
  // Also add to Redis blacklist for immediate JWT invalidation if we were checking that for Access Tokens (we are)
  // But wait, logout usually sends Access Token. Refresh Token is separate.
  // If `token` here is Access Token, we blacklist it.
  // If `token` is Refresh Token, we revoke it.
  // Usually logout endpoint receives Access Token in header and maybe Refresh Token in body.
  
  // Assuming this `logout` function handles Access Token blacklisting
  await redisClient.set(`blacklist:${token}`, 'true', { EX: 3600 });
};

export const revokeSession = async (refreshToken: string) => {
    await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revoked: true }
    });
};

