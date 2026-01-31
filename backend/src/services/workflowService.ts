import prisma from '../utils/prisma';
import { Role, WorkflowStatus, ApprovalActionType, AuditAction } from '@prisma/client';
import { logAction } from './auditService';

export const createTemplate = async (
  name: string,
  organizationId: string,
  createdBy: string,
  steps: { stepOrder: number; roleRequired: Role; stepName: string; isFinal?: boolean; condition?: string }[],
  slaConfig?: { maxApprovalHours: number; escalationRole: Role }
) => {
  return await prisma.workflowTemplate.create({
    data: {
      name,
      organizationId,
      createdBy,
      steps: {
        create: steps.map((s) => ({
          stepOrder: s.stepOrder,
          roleRequired: s.roleRequired,
          stepName: s.stepName,
          isFinal: s.isFinal || false,
          condition: s.condition
        })),
      },
      slaConfig: slaConfig
        ? {
            create: {
              maxApprovalHours: slaConfig.maxApprovalHours,
              escalationRole: slaConfig.escalationRole,
            },
          }
        : undefined,
    },
    include: {
      steps: true,
      slaConfig: true,
    },
  });
};

export const getTemplates = async (organizationId: string) => {
  return await prisma.workflowTemplate.findMany({
    where: { organizationId },
    include: { steps: true, slaConfig: true },
  });
};

import { eventBus, EVENTS } from '../events/eventBus';

export const startWorkflow = async (
  documentId: string,
  workflowTemplateId: string,
  userId: string,
  organizationId: string
) => {
  const template = await prisma.workflowTemplate.findUnique({
    where: { id: workflowTemplateId },
    include: { steps: true }
  });

  if (!template) throw new Error('Template not found');

  // Verify user belongs to organization? (Optional, assumed verified by middleware/logic)
  
  const instance = await prisma.workflowInstance.create({
    data: {
      documentId,
      workflowTemplateId,
      currentStep: 1,
      status: WorkflowStatus.PENDING,
      startedAt: new Date()
    },
    include: {
      workflowTemplate: { include: { steps: true } } // Return full details
    }
  });

  await logAction(
    AuditAction.WORKFLOW_START,
    userId,
    organizationId,
    documentId,
    undefined // IP not passed here, could be enhanced
  );

  eventBus.emit(EVENTS.WORKFLOW_STARTED, {
      documentId,
      userId,
      organizationId,
      instanceId: instance.id
  });

  return instance;
};

// Helper to evaluate condition
const evaluateCondition = (condition: string, metadata: any) => {
    const parts = condition.split(' ');
    if (parts.length === 3) {
        const [field, op, value] = parts;
        const fieldKey = field.replace('metadata.', '');
        // Flatten metadata for easier access
        const flatMetadata = { ...metadata, ...(metadata.customFields || {}) };
        const actualValue = flatMetadata[fieldKey];
        
        if (actualValue === undefined) return false;
        
        const numActual = Number(actualValue);
        const numTarget = Number(value);
        
        if (!isNaN(numActual) && !isNaN(numTarget)) {
             if (op === '>') return numActual > numTarget;
             if (op === '<') return numActual < numTarget;
             if (op === '>=') return numActual >= numTarget;
             if (op === '<=') return numActual <= numTarget;
             if (op === '==') return numActual === numTarget;
        }
        return actualValue == value;
    }
    return true;
};

export const processAction = async (
  instanceId: string,
  action: ApprovalActionType,
  comments: string | null,
  userId: string,
  role: Role,
  organizationId: string
) => {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    include: { workflowTemplate: { include: { steps: true } } },
  });

  if (!instance) throw new Error('Workflow instance not found');

  const currentStep = instance.workflowTemplate.steps.find(
    (s) => s.stepOrder === instance.currentStep
  );

  if (!currentStep) throw new Error('Current step not found');

  // Determine Next Step with Condition Logic
  let nextStepOrder = instance.currentStep + 1;
  let nextStep = instance.workflowTemplate.steps.find(s => s.stepOrder === nextStepOrder);
  
  // Loop to skip steps if condition is false
  while (nextStep && nextStep.condition) {
      const docMetadata = await prisma.documentMetadata.findUnique({ where: { documentId: instance.documentId } });
      if (docMetadata && !evaluateCondition(nextStep.condition, docMetadata)) {
          // Condition failed, skip this step
          nextStepOrder++;
          nextStep = instance.workflowTemplate.steps.find(s => s.stepOrder === nextStepOrder);
      } else {
          // Condition met or no metadata (default true?), break to execute this step
          break; 
      }
  }

  if (action === ApprovalActionType.REJECT) {
    // ... existing update code ...
    
    await logAction(AuditAction.WORKFLOW_REJECT, userId, organizationId, instance.documentId);
    
    eventBus.emit(EVENTS.WORKFLOW_REJECTED, {
        documentId: instance.documentId,
        userId,
        organizationId,
        instanceId
    });

    return { status: WorkflowStatus.REJECTED };
  }

  // Handle Approval
  if (!nextStep) {
    // No more steps, complete workflow
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: WorkflowStatus.APPROVED,
        completedAt: new Date(),
        actions: {
          create: {
            stepId: currentStep.id,
            action: ApprovalActionType.APPROVE,
            comment: comments,
            performedBy: userId,
          },
        },
      },
    });

    await logAction(AuditAction.WORKFLOW_APPROVE, userId, organizationId, instance.documentId);
    
    eventBus.emit(EVENTS.WORKFLOW_APPROVED, {
        documentId: instance.documentId,
        userId,
        organizationId,
        instanceId,
        nextStep: null
    });
    
    return { status: WorkflowStatus.APPROVED };
  } else {
    // Move to next step
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        currentStep: nextStep.stepOrder, // Use the calculated next step order
        actions: {
          create: {
            stepId: currentStep.id,
            action: ApprovalActionType.APPROVE,
            comment: comments,
            performedBy: userId,
          },
        },
      },
    });

    await logAction(AuditAction.WORKFLOW_APPROVE, userId, organizationId, instance.documentId);
    
    eventBus.emit(EVENTS.WORKFLOW_APPROVED, {
        documentId: instance.documentId,
        userId,
        organizationId,
        instanceId,
        nextStep: nextStep.stepOrder
    });

    return { status: WorkflowStatus.PENDING, nextStep: nextStep.stepOrder };
  }
};

export const getPendingWorkflows = async (organizationId: string, role: Role) => {
  // Find instances where current step requires this role
  // This requires joining steps.
  // Prisma doesn't support deep filtering easily on unrelated tables without raw query or careful include.
  // We fetch instances and filter in memory or use where logic if possible.
  
  // Logic: Instance -> Template -> Steps. Filter where Steps[currentStep].role == role
  
  // Improved query:
  const workflows = await prisma.workflowInstance.findMany({
    where: {
      status: WorkflowStatus.PENDING,
      document: { organizationId },
      workflowTemplate: {
        steps: {
            some: {
                roleRequired: role
                // We need to match stepOrder == currentStep. 
                // Prisma 'some' matches if ANY step matches. This is insufficient.
            }
        }
      }
    },
    include: {
        workflowTemplate: { include: { steps: true } },
        document: { select: { id: true, title: true } }
    }
  });

  // Client-side filter for precise step matching
  return workflows.filter(w => {
      const step = w.workflowTemplate.steps.find(s => s.stepOrder === w.currentStep);
      return step && step.roleRequired === role;
  });
};

export const getWorkflowHistory = async (documentId: string) => {
    return await prisma.workflowInstance.findMany({
        where: { documentId },
        include: {
            actions: { orderBy: { performedAt: 'desc' } },
            workflowTemplate: true
        },
        orderBy: { startedAt: 'desc' }
    });
};
