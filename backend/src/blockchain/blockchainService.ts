import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Contract ABI - simplified for our needs
const DocumentRegistryABI = [
    "function registerDocument(string memory _documentId, string memory _hash, string memory _uploaderId) public",
    "function updateDocumentVersion(string memory _documentId, string memory _newHash, string memory _uploaderId) public",
    "function getDocumentHash(string memory _documentId) public view returns (string memory)",
    "function verifyDocument(string memory _documentId, string memory _hash) public view returns (bool, uint256)",
    "function getDocumentHistory(string memory _documentId) public view returns (tuple(string hash, string uploaderId, uint256 timestamp, uint256 version)[])",
    "function logAccess(string memory _documentId, string memory _userId, string memory _actionType) public",
    "function getAccessLogs(string memory _documentId) public view returns (tuple(string userId, string actionType, uint256 timestamp)[])",
    "function signDocument(string memory _documentId, string memory _signerId, string memory _signatureHash, string memory _role) public",
    "function getSignatures(string memory _documentId) public view returns (tuple(string signerId, string signatureHash, string role, uint256 timestamp)[])"
];

class BlockchainService {
    private provider!: ethers.JsonRpcProvider;
    private wallet!: ethers.Wallet;
    private contract!: ethers.Contract;
    private isConnected: boolean = false;

    constructor() {
        try {
            const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
            const privateKey = process.env.PRIVATE_KEY;
            const contractAddress = process.env.CONTRACT_ADDRESS;

            if (!rpcUrl || !privateKey || !contractAddress) {
                console.warn("Blockchain disabled (missing env variables)");
                return;
            }

            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.wallet = new ethers.Wallet(privateKey, this.provider);
            this.contract = new ethers.Contract(contractAddress, DocumentRegistryABI, this.wallet);
            this.isConnected = true;
            console.log(`Blockchain Service initialized successfully. Connected to ${contractAddress}`);
        } catch (error) {
            console.error("Blockchain initialization failed. Service disabled.", error);
            // We do not re-throw error to prevent backend crash.
            // isConnected remains false.
        }
    }

    public isAvailable(): boolean {
        return this.isConnected;
    }

    async registerDocumentHash(documentId: string, hash: string, uploaderId: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            console.log(`Registering document ${documentId} on blockchain...`);
            const start = Date.now();
            const tx = await this.contract.registerDocument(documentId, hash, uploaderId);
            await tx.wait();
            console.log(`Document registered. Tx: ${tx.hash} (Took ${(Date.now() - start) / 1000}s)`);
            return tx.hash;
        } catch (error) {
            console.error("Error registering document on blockchain:", error);
            return null;
        }
    }

    async updateDocumentHash(documentId: string, hash: string, uploaderId: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            console.log(`Updating document ${documentId} on blockchain...`);
            const tx = await this.contract.updateDocumentVersion(documentId, hash, uploaderId);
            await tx.wait();
            console.log(`Document updated. Tx: ${tx.hash}`);
            return tx.hash;
        } catch (error) {
            console.error("Error updating document on blockchain:", error);
            return null;
        }
    }

    async verifyDocumentIntegrity(documentId: string, currentHash: string): Promise<{ verified: boolean; version: number }> {
        if (!this.isConnected) return { verified: false, version: 0 };
        try {
            const result = await this.contract.verifyDocument(documentId, currentHash);
            // Result is [bool, uint256]
            return {
                verified: result[0],
                version: Number(result[1])
            };
        } catch (error) {
            console.error("Error verifying document on blockchain:", error);
            return { verified: false, version: 0 };
        }
    }

    async getDocumentHistory(documentId: string) {
        if (!this.isConnected) return [];
        try {
            const history = await this.contract.getDocumentHistory(documentId);
            // Transform result
            return history.map((h: any) => ({
                hash: h.hash,
                uploaderId: h.uploaderId,
                timestamp: Number(h.timestamp),
                version: Number(h.version)
            }));
        } catch (error) {
            console.error("Error fetching document history:", error);
            return [];
        }
    }

    // Phase 4: Access Logging & Signatures
    async logDocumentAccess(documentId: string, userId: string, actionType: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            console.log(`Logging ${actionType} access for document ${documentId} by user ${userId} on blockchain...`);
            const tx = await this.contract.logAccess(documentId, userId, actionType);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error("Error logging document access on blockchain:", error);
            return null;
        }
    }

    async getAccessLogs(documentId: string) {
        if (!this.isConnected) return [];
        try {
            const logs = await this.contract.getAccessLogs(documentId);
            return logs.map((l: any) => ({
                userId: l.userId,
                actionType: l.actionType,
                timestamp: Number(l.timestamp)
            }));
        } catch (error) {
            console.error("Error fetching access logs:", error);
            return [];
        }
    }

    async signDocument(documentId: string, signerId: string, signatureHash: string, role: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            console.log(`Signing document ${documentId} on blockchain...`);
            const tx = await this.contract.signDocument(documentId, signerId, signatureHash, role);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error("Error signing document on blockchain:", error);
            return null;
        }
    }

    async getSignatures(documentId: string) {
        if (!this.isConnected) return [];
        try {
            const sigs = await this.contract.getSignatures(documentId);
            return sigs.map((s: any) => ({
                signerId: s.signerId,
                signatureHash: s.signatureHash,
                role: s.role,
                timestamp: Number(s.timestamp)
            }));
        } catch (error) {
            console.error("Error fetching document signatures:", error);
            return [];
        }
    }
}

export const blockchainService = new BlockchainService();
