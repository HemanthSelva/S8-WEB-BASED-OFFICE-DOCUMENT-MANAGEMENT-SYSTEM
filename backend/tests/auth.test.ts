import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/utils/prisma';
import { hashPassword } from '../src/utils/password';

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Auth Test User',
    email: 'authtest@example.com',
    password: 'password123',
    role: 'ADMIN',
  };
  let orgId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.organization.deleteMany({ where: { name: 'Auth Test Org' } });

    // Create Org
    const org = await prisma.organization.create({
      data: { name: 'Auth Test Org' }
    });
    orgId = org.id;

    // Create User
    await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        passwordHash: await hashPassword(testUser.password),
        role: 'ADMIN', // specific cast if needed, but string works if enum matches
        organizationId: orgId,
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  let accessToken: string;
  let refreshToken: string;

  it('should login successfully with valid credentials', async () => {
    const res = await request(app).post('/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('should fail login with invalid password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword'
    });

    expect(res.status).toBe(401);
  });

  it('should refresh access token', async () => {
    const res = await request(app).post('/auth/refresh').send({
      refreshToken
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    // We will implement rotation later, so refresh token might or might not be present yet
  });

  it('should logout successfully', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });
});
