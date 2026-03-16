/*
  Warnings:

  - A unique constraint covering the columns `[name,organizationId]` on the table `WorkflowTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_name_organizationId_key" ON "WorkflowTemplate"("name", "organizationId");
