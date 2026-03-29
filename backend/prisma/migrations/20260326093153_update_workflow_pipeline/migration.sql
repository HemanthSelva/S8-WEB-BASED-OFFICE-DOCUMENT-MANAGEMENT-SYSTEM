/*
  Warnings:

  - Added the required column `organizationId` to the `WorkflowInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkflowInstance" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "startedById" TEXT;

-- AlterTable
ALTER TABLE "WorkflowTemplate" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slaHours" INTEGER NOT NULL DEFAULT 48;

-- CreateIndex
CREATE INDEX "WorkflowInstance_organizationId_idx" ON "WorkflowInstance"("organizationId");

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
