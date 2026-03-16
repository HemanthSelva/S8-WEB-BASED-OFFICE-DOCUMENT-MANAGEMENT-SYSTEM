const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPending() {
    const workflows = await prisma.workflowInstance.findMany({
        where: { status: 'PENDING' },
        include: {
            document: { select: { title: true, organizationId: true } },
            workflowTemplate: { include: { steps: { orderBy: { stepOrder: 'asc' } } } }
        }
    });

    console.log(`Found ${workflows.length} PENDING workflow(s):`);
    for (const wf of workflows) {
        const currentStepDef = wf.workflowTemplate.steps.find(s => s.stepOrder === wf.currentStep);
        console.log({
            id: wf.id,
            document: wf.document.title,
            organizationId: wf.document.organizationId,
            currentStep: wf.currentStep,
            roleRequired: currentStepDef?.roleRequired || 'UNKNOWN'
        });
    }
    await prisma.$disconnect();
}

checkPending();
