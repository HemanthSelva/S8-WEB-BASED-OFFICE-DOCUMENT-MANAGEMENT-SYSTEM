import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.workflowTemplate.findMany({ take: 5 });
  console.log('--- Workflow Templates ---');
  console.log(JSON.stringify(templates, null, 2));

  const instances = await prisma.workflowInstance.findMany({ take: 5, include: { document: true } });
  console.log('\n--- Workflow Instances ---');
  console.log(JSON.stringify(instances, null, 2));

  const orgs = await prisma.organization.findMany({ take: 5 });
  console.log('\n--- Organizations ---');
  console.log(JSON.stringify(orgs, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
