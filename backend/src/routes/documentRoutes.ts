import { Router } from 'express';
import multer from 'multer';
import * as documentController from '../controllers/documentController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.post('/upload',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  upload.single('file'),
  documentController.uploadDocument
);

router.get('/search',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']),
  documentController.searchDocuments
);

router.get('/',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']),
  documentController.getDocuments
);

router.get('/download-all',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  documentController.downloadAllDocuments
);

router.get('/:id',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']),
  documentController.getDocumentById
);

router.put('/:id/update',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  upload.single('file'),
  documentController.updateDocumentFile
);

router.post('/:id/rollback',
  requireRole(['ADMIN', 'MANAGER']),
  documentController.rollbackDocument
);

router.get('/:id/download',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']),
  documentController.downloadDocument
);

router.delete('/:id',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  documentController.deleteDocument
);

router.get('/:id/versions',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']),
  documentController.getDocumentVersions
);

router.get('/:id/verify',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']),
  documentController.verifyDocument
);

router.get('/:id/audit',
  requireRole(['ADMIN', 'MANAGER']),
  documentController.getAuditCertificate
);

router.post('/:id/chat',
  requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']),
  documentController.chatWithDocument
);

export default router;
