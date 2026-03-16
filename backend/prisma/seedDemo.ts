import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use DIRECT_URL for local execution (host machine) to connect to localhost:5432
// DATABASE_URL is typically set to postgres:5432 for Docker inter-container communication
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url,
    },
  },
});

async function main() {
  console.log('Seeding demo data...');
  console.log(`Connecting to database at: ${url}`);

  // 1. Create Organization (Upsert)
  const org = await prisma.organization.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' }, // Consistent with demo data
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Acme Corp',
      domain: 'acme.com',
    },
  });

  console.log('Organization:', org.name);

  // 2. Create Users (Upsert)
  const passwordHash = await hashPassword('password123');
  console.log(`Seeding users with password hash for 'password123': ${passwordHash}`);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: { passwordHash },
    create: {
      name: 'Admin User',
      email: 'admin@acme.com',
      passwordHash,
      role: 'ADMIN',
      organizationId: org.id,
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: { passwordHash },
    create: {
      name: 'Manager User',
      email: 'manager@acme.com',
      passwordHash,
      role: 'MANAGER',
      organizationId: org.id,
      status: 'ACTIVE',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@acme.com' },
    update: { passwordHash },
    create: {
      name: 'Employee User',
      email: 'employee@acme.com',
      passwordHash,
      role: 'EMPLOYEE',
      organizationId: org.id,
      status: 'ACTIVE',
    },
  });

  console.log('Users:', [admin.email, manager.email, employee.email]);

  // 3. Create Workflow Templates
  const templatesToCreate = [
    {
      name: 'Standard Approval Process',
      steps: [
        { stepName: 'Manager Review', roleRequired: 'MANAGER' as Role, stepOrder: 1 },
        { stepName: 'Final Approval', roleRequired: 'ADMIN' as Role, stepOrder: 2, isFinal: true },
      ],
    },
    {
      name: 'Invoice Approval',
      steps: [
        { stepName: 'Finance Review', roleRequired: 'MANAGER' as Role, stepOrder: 1 },
        { stepName: 'Final Payment Approval', roleRequired: 'ADMIN' as Role, stepOrder: 2, isFinal: true },
      ],
    },
    {
      name: 'Contract Review',
      steps: [
        { stepName: 'Legal Review', roleRequired: 'MANAGER' as Role, stepOrder: 1 },
        { stepName: 'Executive Signature', roleRequired: 'ADMIN' as Role, stepOrder: 2, isFinal: true },
      ],
    },
  ];

  for (const t of templatesToCreate) {
    const existing = await prisma.workflowTemplate.findFirst({
      where: { organizationId: org.id, name: t.name },
    });

    if (!existing) {
      const template = await prisma.workflowTemplate.create({
        data: {
          name: t.name,
          organizationId: org.id,
          createdBy: admin.id,
          steps: {
            create: t.steps.map((s, idx) => ({
              stepName: s.stepName,
              roleRequired: s.roleRequired,
              stepOrder: s.stepOrder,
              isFinal: s.isFinal || false,
            })),
          },
          slaConfig: {
            create: {
              maxApprovalHours: 24,
              escalationRole: 'ADMIN',
            },
          },
        },
      });
      console.log('Created Workflow Template:', template.name);
    } else {
      console.log('Workflow Template already exists:', existing.name);
    }
  }

  // 4. Create Mock Notification (Optional: just create one if you want, or skip to avoid spamming)
  await prisma.notification.create({
    data: {
      userId: admin.id,
      organizationId: org.id,
      type: 'SYSTEM',
      title: 'Welcome to IntelliDocX',
      message: 'System initialization complete. Ready for demo.',
      isRead: false,
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
