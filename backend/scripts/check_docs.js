const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const docs = await prisma.document.findMany({
        select: { id: true, title: true, fileName: true, processingStatus: true, status: true, organizationId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(docs, null, 2));
    await prisma.$disconnect();
}

check();
