import * as authService from '../../src/services/authService';
import prisma from '../../src/utils/prisma';
import { hashPassword } from '../../src/utils/password';

describe('Auth Service', () => {
  const testUser = {
    name: 'Service Test User',
    email: 'servicetest@example.com',
    password: 'password123',
    role: 'ADMIN',
  };
  let orgId: string;
  let userId: string;

  beforeAll(async () => {
    // Cleanup potentially existing data
    try {
        const existingUser = await prisma.user.findUnique({ where: { email: testUser.email } });
        if (existingUser) {
            await prisma.loginHistory.deleteMany({ where: { userId: existingUser.id } });
            await prisma.refreshToken.deleteMany({ where: { userId: existingUser.id } });
            await prisma.user.delete({ where: { id: existingUser.id } });
        }
    } catch (e) {}

    const org = await prisma.organization.create({ data: { name: 'Service Test Org' } });
    orgId = org.id;

    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        passwordHash: await hashPassword(testUser.password),
        role: 'ADMIN', // @ts-ignore
        organizationId: orgId,
        status: 'ACTIVE'
      }
    });
    userId = user.id;
  });

  afterAll(async () => {
    try {
        await prisma.loginHistory.deleteMany({ where: { userId } });
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.organization.deleteMany({ where: { id: orgId } });
    } catch (e) {}
    await prisma.$disconnect();
  });

  it('should login and create history', async () => {
    const result = await authService.login(testUser.email, testUser.password, '127.0.0.1', 'Jest');
    
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    
    const history = await prisma.loginHistory.findFirst({
        where: { userId, success: true },
        orderBy: { timestamp: 'desc' }
    });
    expect(history).toBeDefined();
    expect(history?.ipAddress).toBe('127.0.0.1');
  });

  it('should refresh token and rotate', async () => {
    const loginResult = await authService.login(testUser.email, testUser.password, '127.0.0.1', 'Jest');
    const oldRefreshToken = loginResult.refreshToken;
    
    const refreshResult = await authService.refresh(oldRefreshToken, '127.0.0.1');
    expect(refreshResult).toHaveProperty('accessToken');
    expect(refreshResult).toHaveProperty('refreshToken');
    expect(refreshResult.refreshToken).not.toBe(oldRefreshToken);
    
    // Check if old token is revoked
    const oldTokenDb = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
    expect(oldTokenDb?.revoked).toBe(true);
    expect(oldTokenDb?.replacedByToken).toBe(refreshResult.refreshToken);
  });
});
