const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- Current Users in DB ---');
        for (const user of users) {
            console.log(`Email: ${user.email}`);
            console.log(`Hash: ${user.passwordHash}`);

            const isP123 = await bcrypt.compare('password123', user.passwordHash);
            const isSAP = await bcrypt.compare('secure_admin_password', user.passwordHash);

            console.log(`Matches 'password123': ${isP123}`);
            console.log(`Matches 'secure_admin_password': ${isSAP}`);
            console.log('---------------------------');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
