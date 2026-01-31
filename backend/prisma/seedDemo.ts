import { PrismaClient } from '@prisma/client';
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
    where: { id: 'acme-corp-id' }, // Using a deterministic ID for upsert
    update: {},
    create: {
      id: 'acme-corp-id',
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

  // 3. Create Workflow Template (Upsert not directly available for complex nested creates without unique constraint on name+org)
  // We'll check if it exists first
  const existingTemplate = await prisma.workflowTemplate.findFirst({
    where: {
      organizationId: org.id,
      name: 'Standard Approval Process',
    },
  });

  if (!existingTemplate) {
    const template = await prisma.workflowTemplate.create({
      data: {
        name: 'Standard Approval Process',
        organizationId: org.id,
        createdBy: admin.id,
        steps: {
          create: [
            {
              stepName: 'Manager Review',
              roleRequired: 'MANAGER',
              stepOrder: 1,
              isFinal: false,
            },
            {
              stepName: 'Final Approval',
              roleRequired: 'ADMIN',
              stepOrder: 2,
              isFinal: true,
            },
          ],
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
    console.log('Workflow Template already exists:', existingTemplate.name);
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
