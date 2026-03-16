const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAll() {
    const orgId = '11111111-1111-1111-1111-111111111111';

    // Find or create admin user
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', organizationId: orgId } });
    if (!admin) {
        console.error('No admin user found.');
        await prisma.$disconnect();
        return;
    }
    console.log('Using admin:', admin.email);

    // Check if template exists
    let template = await prisma.workflowTemplate.findFirst({
        where: { name: 'Standard Approval Process', organizationId: orgId },
        include: { steps: true }
    });

    if (!template) {
        console.log('Creating Standard Approval Process template...');
        template = await prisma.workflowTemplate.create({
            data: {
                name: 'Standard Approval Process',
                organizationId: orgId,
                createdBy: admin.id,
                steps: {
                    create: [
                        { stepOrder: 1, roleRequired: 'MANAGER', stepName: 'Manager Review', isFinal: false },
                        { stepOrder: 2, roleRequired: 'ADMIN', stepName: 'Final Approval', isFinal: true }
                    ]
                }
            },
            include: { steps: true }
        });
        console.log('Template created:', template.id);
    } else {
        console.log('Template exists:', template.id);
    }

    // Find all ACTIVE docs without workflows
    const docs = await prisma.document.findMany({
        where: { status: 'ACTIVE', workflowInstances: { none: {} } },
        include: { owner: true }
    });

    console.log(`Found ${docs.length} docs without workflows.`);
    for (const doc of docs) {
        try {
            await prisma.workflowInstance.create({
                data: {
                    documentId: doc.id,
                    workflowTemplateId: template.id,
                    currentStep: 1,
                    status: 'PENDING',
                    startedAt: new Date()
                }
            });
            console.log('Created workflow for:', doc.title);
        } catch (e) {
            console.error('Failed for:', doc.title, e.message);
        }
    }

    console.log('Done!');
    await prisma.$disconnect();
}

fixAll();
