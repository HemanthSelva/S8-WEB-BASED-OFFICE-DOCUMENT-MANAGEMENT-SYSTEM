import express from 'express';
import { systemChat } from '../controllers/chatController';

const router = express.Router();

router.post('/system', systemChat);

export default router;
