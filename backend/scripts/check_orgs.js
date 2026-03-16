const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const orgs = await prisma.organization.findMany();
    console.log(JSON.stringify(orgs, null, 2));
    await prisma.$disconnect();
}

check();
