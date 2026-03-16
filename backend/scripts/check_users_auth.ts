import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany();
    console.log('--- Current Users in DB ---');
    for (const user of users) {
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status}`);
        console.log(`Password Hash: ${user.passwordHash}`);

        // Check against 'password123'
        const isP123 = await bcrypt.compare('password123', user.passwordHash);
        console.log(`Matches 'password123': ${isP123}`);

        // Check against 'secure_admin_password'
        const isSAP = await bcrypt.compare('secure_admin_password', user.passwordHash);
        console.log(`Matches 'secure_admin_password': ${isSAP}`);
        console.log('---------------------------');
    }
}

checkUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
