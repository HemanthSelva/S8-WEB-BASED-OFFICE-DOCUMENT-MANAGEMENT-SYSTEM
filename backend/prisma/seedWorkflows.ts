import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding workflow templates...');

    // Get the default organization
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.error('No organization found. Run main seed first.');
        return;
    }

    // Get admin user for createdBy
    const admin = await prisma.user.findFirst({
        where: { role: Role.ADMIN, organizationId: org.id }
    });

    if (!admin) {
        console.error('No admin user found.');
        return;
    }

    // 1. Invoice Approval Workflow
    const invoiceCheck = await prisma.workflowTemplate.findFirst({
        where: { name: 'Invoice Approval', organizationId: org.id }
    });

    if (!invoiceCheck) {
        // Create template first
        const invoiceTemplate = await prisma.workflowTemplate.create({
            data: {
                name: 'Invoice Approval',
                organizationId: org.id,
                createdBy: admin.id
            }
        });

        // Then create steps separately
        await prisma.workflowStep.createMany({
            data: [
                {
                    workflowTemplateId: invoiceTemplate.id,
                    stepOrder: 1,
                    stepName: 'Manager Review',
                    roleRequired: Role.MANAGER
                },
                {
                    workflowTemplateId: invoiceTemplate.id,
                    stepOrder: 2,
                    stepName: 'Finance Approval',
                    roleRequired: Role.ADMIN
                }
            ]
        });

        console.log('✅ Created Invoice Approval Template');
    } else {
        console.log('ℹ️  Invoice Approval Template already exists');
    }

    // 2. Contract Review Workflow
    const contractCheck = await prisma.workflowTemplate.findFirst({
        where: { name: 'Contract Review', organizationId: org.id }
    });

    if (!contractCheck) {
        // Create template first
        const contractTemplate = await prisma.workflowTemplate.create({
            data: {
                name: 'Contract Review',
                organizationId: org.id,
                createdBy: admin.id
            }
        });

        // Then create steps separately
        await prisma.workflowStep.createMany({
            data: [
                {
                    workflowTemplateId: contractTemplate.id,
                    stepOrder: 1,
                    stepName: 'Legal Review',
                    roleRequired: Role.MANAGER
                },
                {
                    workflowTemplateId: contractTemplate.id,
                    stepOrder: 2,
                    stepName: 'Final Sign-off',
                    roleRequired: Role.ADMIN
                }
            ]
        });

        console.log('✅ Created Contract Review Template');
    } else {
        console.log('ℹ️  Contract Review Template already exists');
    }

    console.log('\n✅ Workflow seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
