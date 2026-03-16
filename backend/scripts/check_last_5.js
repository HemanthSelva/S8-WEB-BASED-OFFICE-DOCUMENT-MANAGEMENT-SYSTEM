const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('--- Last 5 Documents ---');
    const docs = await prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            status: true,
            processingStatus: true,
            createdAt: true,
            owner: { select: { email: true, role: true } },
            workflowInstances: {
                select: {
                    id: true,
                    status: true,
                    currentStep: true,
                    workflowTemplate: {
                        select: { name: true, steps: { select: { stepOrder: true, roleRequired: true, stepName: true } } }
                    }
                }
            }
        }
    });

    console.log(JSON.stringify(docs, null, 2));
    await prisma.$disconnect();
}

check();
