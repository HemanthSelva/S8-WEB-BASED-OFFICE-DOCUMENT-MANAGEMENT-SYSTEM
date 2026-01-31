import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole(['ADMIN']), userController.createUser);
router.get('/', requireRole(['ADMIN', 'MANAGER']), userController.getUsers);
router.put('/:id', requireRole(['ADMIN']), userController.updateUser);
router.delete('/:id', requireRole(['ADMIN']), userController.deleteUser);

export default router;
