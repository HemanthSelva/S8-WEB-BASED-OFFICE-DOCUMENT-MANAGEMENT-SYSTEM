const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api';

async function testFullFlow() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@acme.com',
            password: 'password123'
        });
        const token = loginRes.data.accessToken;
        console.log('Login successful.');

        // 2. Upload Document
        console.log('Uploading document...');
        const form = new FormData();
        form.append('file', fs.createReadStream('test_invoice.pdf'));
        form.append('title', 'Optimization Test - Invoice');

        const start = Date.now();
        const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        // The response might be the document itself or { document: doc }
        const doc = uploadRes.data.document || uploadRes.data;
        const docId = doc.id;

        if (!docId) {
            console.error('Could not find document ID in response:', uploadRes.data);
            return;
        }
        console.log(`Upload Status: ${uploadRes.status} (Took ${(Date.now() - start) / 1000}s)`);
        console.log(`Document ID: ${docId}`);

        // 3. Monitor Status
        console.log('Monitoring status...');
        let status = 'PENDING';
        const monitorStart = Date.now();
        while (status !== 'COMPLETED' && status !== 'FAILED') {
            const statusRes = await axios.get(`${API_URL}/documents/${docId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            status = statusRes.data.document ? statusRes.data.document.processingStatus : statusRes.data.processingStatus;
            console.log(`Status: ${status} (Elapsed: ${((Date.now() - monitorStart) / 1000).toFixed(1)}s)`);
            if (status !== 'COMPLETED' && status !== 'FAILED') {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            if (Date.now() - monitorStart > 180000) {
                console.log('Timed out after 3 minutes.');
                break;
            }
        }
        console.log(`Total background processing time: ${((Date.now() - monitorStart) / 1000).toFixed(1)}s`);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testFullFlow();
