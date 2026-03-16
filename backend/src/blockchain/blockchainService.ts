import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Contract ABI - simplified for our needs
const DocumentRegistryABI = [
    "function registerDocument(string memory _documentId, string memory _hash, string memory _uploaderId) public",
    "function updateDocumentVersion(string memory _documentId, string memory _newHash, string memory _uploaderId) public",
    "function getDocumentHash(string memory _documentId) public view returns (string memory)",
    "function verifyDocument(string memory _documentId, string memory _hash) public view returns (bool, uint256)",
    "function getDocumentHistory(string memory _documentId) public view returns (tuple(string hash, string uploaderId, uint256 timestamp, uint256 version)[])"
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
}

export const blockchainService = new BlockchainService();
