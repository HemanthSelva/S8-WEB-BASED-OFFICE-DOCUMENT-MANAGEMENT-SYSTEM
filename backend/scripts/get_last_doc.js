const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const doc = await prisma.document.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1
            }
        }
    });

    if (doc && doc.versions.length > 0) {
        console.log(`Last Document ID: ${doc.id}`);
        console.log(`File Path: ${doc.versions[0].storagePath}`);
        console.log(`Organization ID: ${doc.organizationId}`);
        console.log(`Title: ${doc.title}`);
        console.log(`FileName: ${doc.fileName}`);
    } else {
        console.log('No documents found or no versions found.');
    }
    await prisma.$disconnect();
}
main();
