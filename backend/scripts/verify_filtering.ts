
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'manager@acme.com';
const PASSWORD = 'secure_admin_password';

async function verifyFiltering() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.accessToken;
        console.log('✅ Login successful.');

        // 2. Filter by Category: RESUME
        console.log('\n--- Filtering by Category: RESUME ---');
        const resumeRes = await axios.get(`${API_URL}/documents?category=RESUME`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const resumes = resumeRes.data.data;
        console.log(`Found ${resumes.length} resumes.`);
        if (resumes.length > 0) {
            const allMatch = resumes.every((d: any) => d.category === 'RESUME');
            if (allMatch) console.log('✅ All results match category RESUME');
            else console.error('❌ Mismatch in category results');
            resumes.forEach((d: any) => console.log(`   - ${d.title} (${d.category})`));
        } else {
            console.warn('⚠️ No resumes found to verify.');
        }

        // 3. Filter by Department: General
        console.log('\n--- Filtering by Department: General ---');
        const deptRes = await axios.get(`${API_URL}/documents?department=General`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const generalDocs = deptRes.data.data;
        console.log(`Found ${generalDocs.length} General documents.`);
        if (generalDocs.length > 0) {
            // Check metadata
            const allMatch = generalDocs.every((d: any) => d.metadata?.department === 'General');
            if (allMatch) console.log('✅ All results match department General');
            else console.error('❌ Mismatch in department results');
            generalDocs.forEach((d: any) => console.log(`   - ${d.title} (${d.metadata?.department})`));
        } else {
            console.warn('⚠️ No General documents found to verify.');
        }

    } catch (error: any) {
        console.error('❌ Filtering Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

verifyFiltering();
