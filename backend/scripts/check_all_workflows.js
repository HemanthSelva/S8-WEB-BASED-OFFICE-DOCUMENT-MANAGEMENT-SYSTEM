const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
    const workflows = await prisma.workflowInstance.findMany({
        include: {
            document: { select: { title: true, status: true } },
            workflowTemplate: { include: { steps: { orderBy: { stepOrder: 'asc' } } } }
        }
    });

    console.log(`Total workflow instances: ${workflows.length}`);
    for (const wf of workflows) {
        const currentStepDef = wf.workflowTemplate.steps.find(s => s.stepOrder === wf.currentStep);
        console.log({
            id: wf.id,
            document: wf.document.title,
            docStatus: wf.document.status,
            workflowStatus: wf.status,
            currentStep: wf.currentStep,
            roleRequired: currentStepDef?.roleRequired || 'UNKNOWN',
            startedAt: wf.startedAt
        });
    }
    await prisma.$disconnect();
}

checkAll();
