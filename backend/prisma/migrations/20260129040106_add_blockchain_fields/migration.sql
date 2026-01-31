-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "blockchainTxHash" TEXT;
