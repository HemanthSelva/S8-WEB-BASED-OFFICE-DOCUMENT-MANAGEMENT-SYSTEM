const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const templates = await prisma.workflowTemplate.findMany({
        select: { id: true, name: true, organizationId: true }
    });
    console.log(JSON.stringify(templates, null, 2));
    await prisma.$disconnect();
}

check();
