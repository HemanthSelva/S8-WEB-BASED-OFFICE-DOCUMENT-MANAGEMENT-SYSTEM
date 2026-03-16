
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function verifyWorkflowAutoStart() {
    console.log('--- Verifying Workflow Auto-Start ---');
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'manager@acme.com',
            password: 'secure_admin_password'
        });
        const token = loginRes.data.accessToken;
        console.log('✅ Login successful.');

        // 2. Upload
        console.log('Uploading PDF Invoice...');
        const form = new FormData();
        const filePath = path.join(__dirname, '../test_assets/test_invoice.pdf');

        if (!fs.existsSync(filePath)) {
            throw new Error(`Test file not found at ${filePath}`);
        }

        form.append('file', fs.createReadStream(filePath));
        form.append('title', `Auto-Workflow Test ${Date.now()}`);
        // We do NOT send category explicitly, relying on filename classification
        // form.append('category', 'INVOICE'); 

        const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        const docId = uploadRes.data.id;
        const category = uploadRes.data.category;
        console.log(`✅ Upload successful. Doc ID: ${docId}, Category: ${category}`);

        if (category !== 'INVOICE') {
            console.error('❌ Classification failed. Expected INVOICE.');
            return;
        }

        // 3. Verify Workflow in DB
        console.log('Verifying Workflow Instance in DB...');

        // Wait a moment for async processing if any (though startWorkflow is awaited in controller)
        await new Promise(r => setTimeout(r, 1000));

        // Debug: Check Templates
        const templates = await prisma.workflowTemplate.findMany();
        console.log('--- Available Templates ---');
        templates.forEach(t => console.log(`- ${t.name} (Org: ${t.organizationId})`));
        console.log('---------------------------');

        const workflow = await prisma.workflowInstance.findFirst({
            where: { documentId: docId },
            include: { workflowTemplate: true }
        });

        if (workflow) {
            console.log(`✅ Workflow Instance Found! ID: ${workflow.id}`);
            console.log(`   Template: ${workflow.workflowTemplate.name}`);
            console.log(`   Status: ${workflow.status}`);

            if (workflow.workflowTemplate.name === 'Invoice Approval' && workflow.status === 'PENDING') {
                console.log('✅ SUCCESS: Automatic Workflow Trigger verified.');
            } else {
                console.error('❌ Workflow content mismatch.');
            }
        } else {
            console.error('❌ No Workflow Instance found for this document.');
        }

    } catch (error: any) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

verifyWorkflowAutoStart();
