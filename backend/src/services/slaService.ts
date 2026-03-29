import prisma from '../utils/prisma';
import { WorkflowStatus, AuditAction } from '@prisma/client';
import { logAction } from './auditService';
import { eventBus, EVENTS } from '../events/eventBus';

export const checkSLABreaches = async () => {
  const pendingWorkflows = await prisma.workflowInstance.findMany({
    where: { status: WorkflowStatus.PENDING },
    include: {
      template: {
        include: { slaConfig: true },
      },
      document: true,
    },
  });

  for (const workflow of pendingWorkflows) {
    if (!workflow.template.slaConfig) continue;

    const { maxApprovalHours, escalationRole } = workflow.template.slaConfig;
    const hoursElapsed = (Date.now() - workflow.startedAt.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > maxApprovalHours) {
      console.log(`Escalating workflow ${workflow.id} for document ${workflow.documentId}`);

      await prisma.workflowInstance.update({
        where: { id: workflow.id },
        data: { status: WorkflowStatus.ESCALATED },
      });

      // Log escalation
      await logAction(
        AuditAction.WORKFLOW_ESCALATE,
        'SYSTEM', // System user
        workflow.document.organizationId,
        workflow.documentId
      );

      eventBus.emit(EVENTS.WORKFLOW_ESCALATED, {
          documentId: workflow.documentId,
          organizationId: workflow.document.organizationId,
          instanceId: workflow.id
      });
    }
  }
};
