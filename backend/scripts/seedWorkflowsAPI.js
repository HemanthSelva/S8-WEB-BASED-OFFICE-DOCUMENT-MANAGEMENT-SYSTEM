const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function seedWorkflows() {
    console.log('Seeding workflow templates via API...');

    try {
        // Login as admin to get token
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@acme.com',
            password: 'secure_admin_password'
        });

        const token = loginResponse.data.accessToken;
        const headers = { 'Cookie': `accessToken=${token}` };

        // Create Invoice Approval Template
        try {
            const invoiceTemplate = await axios.post(
                `${API_URL}/workflows/templates`,
                {
                    name: 'Invoice Approval',
                    steps: [
                        { stepOrder: 1, roleRequired: 'MANAGER', stepName: 'Manager Review' },
                        { stepOrder: 2, roleRequired: 'ADMIN', stepName: 'Finance Approval' }
                    ]
                },
                { headers }
            );
            console.log('✅ Created Invoice Approval template:', invoiceTemplate.data.id);
        } catch (e) {
            if (e.response?.status === 400 && e.response?.data?.message?.includes('already exists')) {
                console.log('ℹ️  Invoice Approval template already exists');
            } else {
                throw e;
            }
        }

        // Create Contract Review Template
        try {
            const contractTemplate = await axios.post(
                `${API_URL}/workflows/templates`,
                {
                    name: 'Contract Review',
                    steps: [
                        { stepOrder: 1, roleRequired: 'MANAGER', stepName: 'Legal Review' },
                        { stepOrder: 2, roleRequired: 'ADMIN', stepName: 'Final Sign-off' }
                    ]
                },
                { headers }
            );
            console.log('✅ Created Contract Review template:', contractTemplate.data.id);
        } catch (e) {
            if (e.response?.status === 400 && e.response?.data?.message?.includes('already exists')) {
                console.log('ℹ️  Contract Review template already exists');
            } else {
                throw e;
            }
        }

        console.log('\n✅ Workflow seeding complete!');
    } catch (error) {
        console.error('❌ Error seeding workflows:', error.response?.data || error.message);
        process.exit(1);
    }
}

seedWorkflows();
