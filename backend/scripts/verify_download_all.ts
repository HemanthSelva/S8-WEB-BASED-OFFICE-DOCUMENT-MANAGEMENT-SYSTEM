
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'manager@acme.com';
const PASSWORD = 'secure_admin_password';

async function verifyDownloadAll() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.accessToken;
        console.log('✅ Login successful.');

        // Test Download All with Category RESUME
        console.log('\n--- Testing Download All (Category: RESUME) ---');
        const res = await axios.get(`${API_URL}/documents/download-all?category=RESUME`, {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'arraybuffer' // Important for binary
        });

        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Content-Length:', res.headers['content-length']);

        if (res.status === 200 && res.headers['content-type'] === 'application/zip') {
            console.log('✅ Download All response is valid ZIP.');
            // Save to file to inspect manually if needed, or just trust size > 0
            const outputPath = path.join(__dirname, 'test_download_resume.zip');
            fs.writeFileSync(outputPath, res.data);
            console.log(`Saved to ${outputPath} (${res.data.length} bytes)`);
        } else {
            console.error('❌ Invalid response');
        }

    } catch (error: any) {
        console.error('❌ Download Failed:', error.message);
        if (error.response) {
            console.log('Data:', error.response.data.toString());
        }
    }
}

verifyDownloadAll();
