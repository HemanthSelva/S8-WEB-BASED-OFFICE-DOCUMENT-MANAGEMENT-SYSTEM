const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Checking Workflow Instances...');

    const instances = await prisma.workflowInstance.findMany({
        include: {
            document: { select: { title: true, organizationId: true } },
            workflowTemplate: {
                include: { steps: true }
            }
        }
    });

    console.log(`Found ${instances.length} instances.`);

    instances.forEach(inst => {
        const currentStep = inst.workflowTemplate.steps.find(s => s.stepOrder === inst.currentStep);
        console.log(`---`);
        console.log(`Document: ${inst.document.title}`);
        console.log(`Org: ${inst.document.organizationId}`);
        console.log(`Status: ${inst.status}`);
        console.log(`Current Step: ${inst.currentStep}`);
        console.log(`Requires Role: ${currentStep ? currentStep.roleRequired : 'NOT FOUND'}`);
    });

    await prisma.$disconnect();
}

check();
