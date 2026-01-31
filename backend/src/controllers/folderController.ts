import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { z } from 'zod';

const CreateFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional().nullable(),
});

export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { name, parentId } = CreateFolderSchema.parse(req.body);
    const user = req.user;

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId || null,
        organizationId: user.organizationId,
      },
    });

    res.status(201).json(folder);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getFolders = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { parentId } = req.query;

    const where: any = { organizationId: user.organizationId };
    if (parentId === 'null' || parentId === undefined) {
        where.parentId = null;
    } else {
        where.parentId = String(parentId);
    }

    const folders = await prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(folders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Check ownership/org
        const folder = await prisma.folder.findFirst({
            where: { id, organizationId: user.organizationId }
        });

        if (!folder) return res.status(404).json({ message: 'Folder not found' });

        // Recursive delete or block if not empty?
        // Prisma cascade might handle it if configured, but usually we want to block if files exist.
        // For now, let's assume cascade or simple delete.
        await prisma.folder.delete({ where: { id } });

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
