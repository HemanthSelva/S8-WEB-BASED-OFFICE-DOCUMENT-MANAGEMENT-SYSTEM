const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testUpload() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'manager@acme.com',
            password: 'secure_admin_password'
        });

        const token = loginRes.data.accessToken;
        console.log('Login successful. Token:', token ? 'Found' : 'Missing');

        // 2. Upload
        console.log('Uploading test_invoice.pdf...');
        const form = new FormData();
        form.append('file', fs.createReadStream(path.join(__dirname, 'test_invoice.pdf')));
        form.append('title', 'Test Invoice');
        form.append('category', 'INVOICE');

        const uploadRes = await axios.post(`${API_URL}/documents/upload`, form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        console.log('Upload successful!', uploadRes.data);
    } catch (error) {
        if (error.response) {
            console.error('Upload failed:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUpload();
