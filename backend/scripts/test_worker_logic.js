const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWorkerLogic() {
    const documentId = "0a55970d-1eef-4ebc-89b8-2345a91bd9cf"; // Operations_Report.pdf
    const organizationId = "11111111-1111-1111-1111-111111111111";

    try {
        const doc = await prisma.document.findUnique({ where: { id: documentId } });
        console.log('Doc category found:', doc.category);

        let templateName = 'Standard Approval Process';
        if (doc.category && doc.category.toUpperCase() === 'INVOICE') templateName = 'Invoice Approval';
        if (doc.category && doc.category.toUpperCase() === 'CONTRACT') templateName = 'Contract Review';

        console.log('Target template:', templateName);

        // Simulate import
        const workflowService = require('./src/services/workflowService');
        console.log('Service imported');

        let template = await workflowService.getTemplateByName(templateName, organizationId);
        console.log('Template fetched:', template ? template.id : 'NOT FOUND');

        // Fallback
        if (!template && templateName !== 'Standard Approval Process') {
            console.log('Falling back...');
            template = await workflowService.getTemplateByName('Standard Approval Process', organizationId);
        }

        if (template) {
            console.log('Attempting startWorkflow...');
            // await workflowService.startWorkflow(documentId, template.id, doc.ownerId, organizationId);
            console.log('Success (simulated startWorkflow)');
        } else {
            console.log('No template found to start workflow.');
        }
    } catch (e) {
        console.error('Test Worker Logic Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testWorkerLogic();
