const axios = require('axios');

const AI_SERVICE_URL = 'http://localhost:8000';
const AI_SERVICE_API_KEY = 'intellidocx-ai-secret-key';

async function testProcess() {
    const data = {
        documentId: '0c090d81-9680-4ec9-b9c1-22e33ea12e93',
        organizationId: '11111111-1111-1111-1111-111111111111',
        filePath: '11111111-1111-1111-1111-111111111111/b2384584-52d9-42b8-9be5-b0a2816fd3ac-Operations_Report.pdf',
        title: 'Operations_Report.pdf',
        fileName: 'Operations_Report.pdf'
    };

    console.log('Sending request to AI service...');
    const start = Date.now();
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/ai/process-document`, data, {
            headers: {
                'X-API-Key': AI_SERVICE_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const duration = (Date.now() - start) / 1000;
        console.log(`Success! Total time: ${duration.toFixed(2)}s`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testProcess();
