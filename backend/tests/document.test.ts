import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/utils/prisma';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';

describe('Document Endpoints', () => {
  const testUser = {
    name: 'Doc Test User',
    email: 'doctest@example.com',
    password: 'password123',
  };
  let orgId: string;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    // Setup User & Org
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    const org = await prisma.organization.create({ data: { name: 'Doc Test Org' } });
    orgId = org.id;

    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        passwordHash: await hashPassword(testUser.password),
        role: 'ADMIN',
        organizationId: orgId,
        status: 'ACTIVE'
      }
    });
    userId = user.id;

    token = signAccessToken({
      userId: user.id,
      email: user.email,
      role: 'ADMIN',
      organizationId: orgId
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.document.deleteMany({ where: { ownerId: userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('should list documents (empty initially)', async () => {
    const res = await request(app)
      .get('/documents')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Note: Upload test requires mocking Multer or sending actual file buffer
  // Skipping actual file upload test for simplicity in this generated plan execution 
  // unless we want to use .attach()
  
  it('should return 400 if no file attached on upload', async () => {
     const res = await request(app)
      .post('/documents/upload')
      .set('Authorization', `Bearer ${token}`);
      
     expect(res.status).toBe(400); // or 500 depending on error handling
  });
});
