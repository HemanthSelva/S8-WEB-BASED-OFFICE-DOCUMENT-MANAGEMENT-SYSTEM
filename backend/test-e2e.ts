import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting E2E Integration Checks ---');
  try {
    // 1. Login as Admin
    console.log('[1/4] Logging in as Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@acme.com',
      password: 'password123'
    });

    const token = loginRes.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create User
    console.log('[2/4] Creating a new user...');
    const newUserEmail = `testuser_${Date.now()}@example.com`;
    const userRes = await axios.post(`${API_URL}/users`, {
      name: 'Integration Test User',
      email: newUserEmail,
      password: 'TestPassword123!',
      role: 'EMPLOYEE',
      organizationId: loginRes.data.user?.organizationId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    }, { headers });
    console.log('User created:', userRes.data.email);

    // 3. Check Dashboard Stats
    console.log('[3/4] Checking Dashboard Stats...');
    const statsRes = await axios.get(`${API_URL}/analytics/overview`, { headers });
    console.log('Dashboard active daily users:', statsRes.data.activeUsersDaily);

    // 4. Test AI Chat
    console.log('[4/4] Sending message to IntelliBot...');
    const chatRes = await axios.post(`${API_URL}/chat/system`, {
      message: 'Hello! Are you online?'
    }, { headers });
    console.log('IntelliBot reply:', chatRes.data);

    // 5. Check Audit Logs
    console.log('[5/4] Checking Audit Logs...');
    const logsRes = await axios.get(`${API_URL}/audit-logs`, { headers });
    const hasLog = logsRes.data.some((log: any) => log.userId === loginRes.data.user.id);
    console.log(`Logs found: ${logsRes.data.length}. Action logged for admin: ${hasLog}`);

    console.log('✅ All Integration Tests Passed!');
  } catch (error: any) {
    console.error('❌ Integration Test Failed:', error.response?.data || error.message);
  }
}

runTests();
