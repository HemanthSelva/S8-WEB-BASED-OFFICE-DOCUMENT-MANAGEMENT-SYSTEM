import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/utils/prisma';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';

describe('Workflow Endpoints', () => {
  let orgId: string;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({ data: { name: 'Workflow Test Org' } });
    orgId = org.id;

    const user = await prisma.user.create({
      data: {
        name: 'Workflow User',
        email: 'workflow@example.com',
        passwordHash: await hashPassword('password'),
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
    await prisma.workflowTemplate.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.$disconnect();
  });

  it('should create a workflow template', async () => {
    const res = await request(app)
      .post('/workflows/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Approval Workflow',
        steps: [
          { stepName: 'Manager Approval', roleRequired: 'MANAGER', stepOrder: 1 },
          { stepName: 'Final Approval', roleRequired: 'ADMIN', stepOrder: 2, isFinal: true }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Approval Workflow');
  });

  it('should list workflow templates', async () => {
    const res = await request(app)
      .get('/workflows/templates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
