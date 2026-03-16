
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Workflow Templates ---');
    const templates = await prisma.workflowTemplate.findMany({
        include: { steps: true }
    });
    console.log(JSON.stringify(templates, null, 2));

    console.log('\n--- Workflow Instances ---');
    const instances = await prisma.workflowInstance.findMany({
        include: {
            document: { select: { title: true, category: true, organizationId: true } },
            workflowTemplate: { select: { name: true } }
        }
    });
    console.log(JSON.stringify(instances, null, 2));

    console.log('\n--- Recent Documents ---');
    const docs = await prisma.document.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, category: true, processingStatus: true }
    });
    console.log(JSON.stringify(docs, null, 2));

    console.log('\n--- Users ---');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, organizationId: true }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
