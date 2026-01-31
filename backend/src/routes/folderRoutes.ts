import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as folderController from '../controllers/folderController';

const router = Router();

router.use(requireAuth);

router.post('/', folderController.createFolder);
router.get('/', folderController.getFolders);
router.delete('/:id', folderController.deleteFolder);

export default router;
