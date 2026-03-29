import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { aiClientService } from '../services/aiClientService';
import Logger from '../utils/logger';

export const systemChat = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    const aiResponse = await aiClientService.systemChat(
      user.organizationId,
      message,
      history || []
    );

    res.json({
      status: 'success',
      data: aiResponse
    });

  } catch (error: any) {
    Logger.error(`System Chat Error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to process chat' });
  }
};
