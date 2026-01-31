import express from 'express';
import { requireAuth } from '../middleware/auth';
import * as searchController from '../controllers/searchController';

const router = express.Router();

router.use(requireAuth);

router.get('/', searchController.searchDocuments);
router.post('/saved', searchController.saveSearch);
router.get('/saved', searchController.getSavedSearches);
router.get('/history', searchController.getRecentSearches);

export default router;
