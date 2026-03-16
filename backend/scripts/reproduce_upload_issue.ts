
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'manager@acme.com';
const PASSWORD = 'secure_admin_password';

async function reproduce() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.accessToken;
        console.log('✅ Login successful.');

        // 2. Upload File with Spaces
        const filePath = path.join(__dirname, '../test_assets/Black and White Minimalist Accountant Resume.pdf');
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        formData.append('title', 'Resume Upload Test');

        console.log('Uploading file:', path.basename(filePath));

        const uploadRes = await axios.post(`${API_URL}/documents/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Upload successful. Doc ID:', uploadRes.data.id);
        console.log('   Category:', uploadRes.data.category);

    } catch (error: any) {
        console.error('❌ Upload Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

reproduce();
