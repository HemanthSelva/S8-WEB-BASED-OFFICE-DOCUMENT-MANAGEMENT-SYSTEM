const { PrismaClient } = require('@prisma/client');
const { startWorkflow, getTemplateByName } = require('./src/services/workflowService');
const prisma = new PrismaClient();

async function fixMissingWorkflows() {
    console.log('Finding documents without workflows...');

    const docsWithoutWorkflows = await prisma.document.findMany({
        where: {
            status: 'ACTIVE',
            workflowInstances: { none: {} }
        },
        include: { owner: true }
    });

    console.log(`Found ${docsWithoutWorkflows.length} documents missing workflows.`);

    for (const doc of docsWithoutWorkflows) {
        try {
            let templateName = 'Standard Approval Process';
            if (doc.category && doc.category.toUpperCase() === 'INVOICE') templateName = 'Invoice Approval';
            if (doc.category && doc.category.toUpperCase() === 'CONTRACT') templateName = 'Contract Review';

            let template = await getTemplateByName(templateName, doc.organizationId);

            if (!template && templateName !== 'Standard Approval Process') {
                template = await getTemplateByName('Standard Approval Process', doc.organizationId);
            }

            if (template) {
                await startWorkflow(doc.id, template.id, doc.ownerId, doc.organizationId);
                console.log(`Successfully started workflow for document: ${doc.title}`);
            } else {
                console.log(`No template found for document: ${doc.title}`);
            }
        } catch (e) {
            console.error(`Failed to start workflow for document ${doc.title}:`, e);
        }
    }

    console.log('Finished fixing workflows.');
    await prisma.$disconnect();
}

fixMissingWorkflows();
