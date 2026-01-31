import { Router } from 'express';
import * as orgController from '../controllers/organizationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', orgController.createOrg);
router.get('/:id', requireAuth, orgController.getOrg);

export default router;
