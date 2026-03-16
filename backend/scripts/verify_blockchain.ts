import { blockchainService } from '../src/blockchain/blockchainService';

async function main() {
    console.log('Verifying Blockchain Service...');

    // 1. Check Connection
    // Accessing private property is not allowed in TS, but we can check via methods
    // or just try to register a document.

    const testId = `test-${Date.now()}`;
    const testHash = '0x' + '1'.repeat(64); // Dummy sha256
    const uploaderId = 'tester';

    console.log(`Attempting to register document: ${testId}`);
    const tx = await blockchainService.registerDocumentHash(testId, testHash, uploaderId);

    if (tx) {
        console.log(`✅ Success! Document registered. Tx Hash: ${tx}`);

        console.log('Verifying integrity...');
        const result = await blockchainService.verifyDocumentIntegrity(testId, testHash);

        if (result.verified) {
            console.log(`✅ Integrity Verified! Version: ${result.version}`);
        } else {
            console.error('❌ Verification failed.');
        }
    } else {
        console.error('❌ Failed to register document. Blockchain service might be disconnected or misconfigured.');
    }
}

main().catch(console.error);
