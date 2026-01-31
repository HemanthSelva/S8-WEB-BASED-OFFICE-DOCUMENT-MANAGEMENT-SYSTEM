import { Router } from 'express';
import * as workflowController from '../controllers/workflowController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(requireAuth);

router.post('/templates', 
  requireRole(['ADMIN']), 
  workflowController.createTemplate
);

router.get('/templates', 
  requireRole(['ADMIN', 'MANAGER']), 
  workflowController.getTemplates
);

router.post('/start/:documentId', 
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), 
  workflowController.startWorkflow
);

router.post('/action/:instanceId', 
  requireRole(['ADMIN', 'MANAGER']), 
  workflowController.performAction
);

router.get('/pending', 
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']), 
  workflowController.getPending
);

router.get('/history/:documentId', 
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']), 
  workflowController.getHistory
);

export default router;
