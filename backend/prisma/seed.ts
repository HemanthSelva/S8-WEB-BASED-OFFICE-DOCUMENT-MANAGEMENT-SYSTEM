import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Use DIRECT_URL if available for local seeding
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url,
    },
  },
});

async function main() {
  const commonPassword = 'password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(commonPassword, salt);

  console.log(`Seeding default data using connection: ${url}`);

  // Clean up existing data to avoid conflicts
  console.log('Cleaning up existing data...');
  // Delete in order to avoid foreign key constraints
  await prisma.workflowLog.deleteMany();
  await prisma.approvalAction.deleteMany();
  await prisma.workflowInstance.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentMetadata.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.sLAConfig.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.permissionGrant.deleteMany();
  await prisma.actionApproval.deleteMany();
  await prisma.userInvitation.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create default Organization
  const org = await prisma.organization.create({
    data: {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'IntelliDocX HQ',
      domain: 'intellidocx.com',
    },
  });

  // Create Users
  const users = [
    {
      email: 'admin@acme.com',
      name: 'System Admin',
      role: Role.ADMIN,
    },
    {
      email: 'manager@acme.com',
      name: 'Manager User',
      role: Role.MANAGER,
    },
    {
      email: 'employee@acme.com',
      name: 'Employee User',
      role: Role.EMPLOYEE,
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        status: UserStatus.ACTIVE,
        organizationId: org.id,
      },
    });
  }

  console.log('\n-------------------------------------');
  console.log('SEEDING COMPLETE');
  console.log('-------------------------------------');

  console.log('\nADMIN LOGIN:');
  console.log('Email: admin@acme.com');
  console.log(`Password: ${commonPassword}`);

  console.log('\nMANAGER LOGIN:');
  console.log('Email: manager@acme.com');
  console.log(`Password: ${commonPassword}`);

  console.log('\nEMPLOYEE LOGIN:');
  console.log('Email: employee@acme.com');
  console.log(`Password: ${commonPassword}`);
  console.log('-------------------------------------\n');

  // Create default Workflow Template for Bug 2 verification
  console.log('Seeding Workflow Template...');
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN, organizationId: org.id } });
  if (admin) {
    await prisma.workflowTemplate.create({
      data: {
        name: 'Standard Document Approval',
        organizationId: org.id,
        createdBy: admin.id,
        isActive: true,
        slaHours: 48,
        steps: {
          create: [
            { order: 1, name: 'Manager Review', requiredRole: Role.MANAGER },
            { order: 2, name: 'Final Admin Approval', requiredRole: Role.ADMIN, isFinal: true }
          ]
        }
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
