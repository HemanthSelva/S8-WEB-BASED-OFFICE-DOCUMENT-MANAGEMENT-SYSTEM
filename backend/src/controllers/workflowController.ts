import { Request, Response } from 'express';
import * as workflowService from '../services/workflowService';
import { AuthRequest } from '../middleware/auth';
import { Role } from '@prisma/client';

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, steps, slaConfig } = req.body;
    const user = req.user;

    const template = await workflowService.createTemplate(
      name,
      user.organizationId,
      user.userId,
      steps,
      slaConfig
    );
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const templates = await workflowService.getTemplates(user.organizationId);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const startWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const { templateId } = req.body;
    const user = req.user;

    const instance = await workflowService.startWorkflow(
      documentId,
      templateId,
      user.userId,
      user.organizationId
    );
    res.status(201).json(instance);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const performAction = async (req: AuthRequest, res: Response) => {
  try {
    const { instanceId } = req.params;
    const { action, comment } = req.body;
    const user = req.user;

    const result = await workflowService.processAction(
      instanceId,
      action,
      comment,
      user.userId,
      user.role,
      user.organizationId
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPending = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const pending = await workflowService.getPendingWorkflows(user.organizationId, user.role);
    res.json(pending);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const history = await workflowService.getWorkflowHistory(documentId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
