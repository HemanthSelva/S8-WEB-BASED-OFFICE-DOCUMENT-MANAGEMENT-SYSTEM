import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { blockchainService } from '../blockchain/blockchainService';
import prisma from '../utils/prisma';
import Logger from '../utils/logger';

export const getAccessLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.organizationId !== req.user!.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await blockchainService.getAccessLogs(id);
    res.json({ logs });
  } catch (error: any) {
    Logger.error(`Error getting access logs: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch access logs' });
  }
};

export const signDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { signatureHash } = req.body;
    const user = req.user!;

    if (!signatureHash) {
      return res.status(400).json({ message: 'Signature hash is required' });
    }

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.organizationId !== req.user!.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const txHash = await blockchainService.signDocument(
      id,
      user.id,
      signatureHash,
      user.role
    );

    if (!txHash) {
       return res.status(500).json({ message: 'Failed to record signature on blockchain' });
    }

    res.json({ message: 'Document explicitly signed', txHash });
  } catch (error: any) {
    Logger.error(`Error signing document: ${error.message}`);
    res.status(500).json({ message: 'Failed to sign document' });
  }
};

export const getSignatures = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.organizationId !== req.user!.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const signatures = await blockchainService.getSignatures(id);
    res.json({ signatures });
  } catch (error: any) {
    Logger.error(`Error getting signatures: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch document signatures' });
  }
};
