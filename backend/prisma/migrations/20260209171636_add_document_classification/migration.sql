-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "category" TEXT,
ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "extractedText" TEXT;

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");
