const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    const TARGET_ORG = '11111111-1111-1111-1111-111111111111';
    const OLD_ORG = 'acme-corp-id';

    console.log(`Starting migration to ${TARGET_ORG}...`);

    // 1. Update WorkflowTemplates
    const templates = await prisma.workflowTemplate.updateMany({
        where: { organizationId: OLD_ORG },
        data: { organizationId: TARGET_ORG }
    });
    console.log(`Updated ${templates.count} templates.`);

    // 2. Update Documents (if any are still using the old ID, though they shouldn't if uploaded recently)
    const docs = await prisma.document.updateMany({
        where: { organizationId: OLD_ORG },
        data: { organizationId: TARGET_ORG }
    });
    console.log(`Updated ${docs.count} documents.`);

    // 3. Update notifications
    const notes = await prisma.notification.updateMany({
        where: { organizationId: OLD_ORG },
        data: { organizationId: TARGET_ORG }
    });
    console.log(`Updated ${notes.count} notifications.`);

    // 4. Update activity logs
    const logs = await prisma.activityLog.updateMany({
        where: { organizationId: OLD_ORG },
        data: { organizationId: TARGET_ORG }
    });
    console.log(`Updated ${logs.count} activity logs.`);

    // 5. Retroactive Workflow Start for documents missing workflows in the TARGET_ORG
    console.log('Checking for documents missing workflows...');
    const activeDocs = await prisma.document.findMany({
        where: {
            organizationId: TARGET_ORG,
            processingStatus: 'COMPLETED',
            status: 'ACTIVE'
        },
        include: {
            workflowInstances: true
        }
    });

    for (const doc of activeDocs) {
        if (doc.workflowInstances.length === 0) {
            console.log(`Starting workflow for document: ${doc.title} (${doc.id})`);

            // Fallback to Standard Approval Process
            const template = await prisma.workflowTemplate.findFirst({
                where: { organizationId: TARGET_ORG, name: 'Standard Approval Process' }
            });

            if (template) {
                // We use a simplified version of startWorkflow logic here
                await prisma.workflowInstance.create({
                    data: {
                        documentId: doc.id,
                        workflowTemplateId: template.id,
                        currentStep: 1,
                        status: 'PENDING',
                        startedAt: new Date()
                    }
                });
                console.log('  Workflow started.');
            } else {
                console.log('  Error: Standard Approval Process template not found in target org.');
            }
        }
    }

    console.log('Migration complete.');
    await prisma.$disconnect();
}

fix();
