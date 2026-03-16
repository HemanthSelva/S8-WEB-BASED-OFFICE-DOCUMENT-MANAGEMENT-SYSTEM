
import { PrismaClient, Role, WorkflowStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin user not found');
    const orgId = admin.organizationId;
    console.log(`Using Organization ID: ${orgId}`);

    console.log('--- Initializing Workflow Templates ---');
    const templates = [
        {
            name: 'Standard Approval Process',
            steps: [
                { stepName: 'Manager Review', roleRequired: 'MANAGER' as Role, stepOrder: 1 },
                { stepName: 'Final Approval', roleRequired: 'ADMIN' as Role, stepOrder: 2, isFinal: true },
            ],
        },
        {
            name: 'Invoice Approval',
            steps: [
                { stepName: 'Finance Review', roleRequired: 'MANAGER' as Role, stepOrder: 1 },
                { stepName: 'Final Payment Approval', roleRequired: 'ADMIN' as Role, stepOrder: 2, isFinal: true },
            ],
        },
        {
            name: 'Contract Review',
            steps: [
                { stepName: 'Legal Review', roleRequired: 'MANAGER' as Role, stepOrder: 1 },
                { stepName: 'Executive Signature', roleRequired: 'ADMIN' as Role, stepOrder: 2, isFinal: true },
            ],
        },
    ];

    for (const t of templates) {
        const existing = await prisma.workflowTemplate.findFirst({
            where: { organizationId: orgId, name: t.name },
        });

        if (!existing) {
            await prisma.workflowTemplate.create({
                data: {
                    name: t.name,
                    organizationId: orgId,
                    createdBy: admin.id,
                    steps: {
                        create: t.steps.map(s => ({ ...s })),
                    },
                },
            });
            console.log(`Created template: ${t.name}`);
        } else {
            console.log(`Template exists: ${t.name}`);
        }
    }

    console.log('\n--- Starting Workflows for Existing Documents ---');
    const docs = await prisma.document.findMany({
        where: {
            processingStatus: 'COMPLETED',
            organizationId: orgId,
            status: { not: 'DELETED' },
            workflowInstances: { none: {} } // Documents without workflows
        }
    });

    console.log(`Found ${docs.length} documents needing workflows.`);

    for (const doc of docs) {
        let templateName = 'Standard Approval Process';
        if (doc.category?.toUpperCase() === 'INVOICE') templateName = 'Invoice Approval';
        if (doc.category?.toUpperCase() === 'CONTRACT') templateName = 'Contract Review';

        const template = await prisma.workflowTemplate.findFirst({
            where: { name: templateName, organizationId: orgId }
        });

        if (template) {
            await prisma.workflowInstance.create({
                data: {
                    documentId: doc.id,
                    workflowTemplateId: template.id,
                    currentStep: 1,
                    status: WorkflowStatus.PENDING,
                    startedAt: new Date()
                }
            });
            console.log(`Started '${templateName}' for document: ${doc.title}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
