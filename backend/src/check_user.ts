
import { PrismaClient } from '@prisma/client';
import { comparePassword } from './utils/password';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@acme.com';
    const password = 'secure_admin_password';

    console.log(`Checking user: ${email}...`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('User NOT found!');
    } else {
        console.log('User FOUND:', user.id, user.role, user.status);
        console.log('Stored Hash:', user.passwordHash);

        const isValid = await comparePassword(password, user.passwordHash);
        console.log(`Password '${password}' is valid: ${isValid}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
