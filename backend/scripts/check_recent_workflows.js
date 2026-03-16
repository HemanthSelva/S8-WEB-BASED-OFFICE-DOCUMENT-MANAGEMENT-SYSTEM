const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Checking recent documents and their workflows...');
  const recentDocs = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      owner: { select: { email: true, role: true } },
      workflowInstances: {
        include: {
          workflowTemplate: {
            include: { steps: true }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(recentDocs, null, 2));

  console.log('--- Workflow Instances ---');
  const workflows = await prisma.workflowInstance.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: {
      document: { select: { title: true } },
      workflowTemplate: {
        include: { steps: true }
      }
    }
  });

  console.log(JSON.stringify(workflows, null, 2));
  await prisma.$disconnect();
}

check();
