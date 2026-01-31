import { Request, Response } from 'express';
import * as documentService from '../services/documentService';
import * as versionService from '../services/versionService';
import * as auditService from '../services/auditService';
import { aiClientService } from '../services/aiClientService';
import { blockchainService } from '../blockchain/blockchainService';
import { uploadFileStream, getFileStream, BUCKET_NAME } from '../storage/minioClient';
import { calculateFileHash } from '../utils/hash';
import { validateFile } from '../utils/fileValidation';
import { AuthRequest } from '../middleware/auth';
import { AuditAction } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { addDocumentJob } from '../services/queueService';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { title, description, department, category, tags } = req.body;
    const user = req.user;

    const validation = validateFile(file as Express.Multer.File);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const fileHash = calculateFileHash(file.buffer);
    const objectName = `${user.organizationId}/${uuidv4()}-${file.originalname}`;

    // Upload to MinIO
    await uploadFileStream(objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
      'x-amz-meta-original-name': file.originalname,
    });

    // Create Document in DB
    const doc = await documentService.createDocument({
      title: title || file.originalname,
      description,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      ownerId: user.userId,
      organizationId: user.organizationId,
    }, objectName);

    // Create Metadata
    if (department || category || tags) {
      await documentService.createMetadata(doc.id, {
        department,
        category,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      });
    }

    // Create Version 1 (This handles Blockchain Registration)
    const version = await versionService.createVersion(
      doc.id,
      1,
      objectName,
      fileHash,
      user.userId
    );

    // Audit Log
    await auditService.logAction(
      AuditAction.UPLOAD,
      user.userId,
      user.organizationId,
      doc.id,
      req.ip
    );

    // Queue for AI Processing
    try {
      await addDocumentJob(doc.id, objectName, user.organizationId);
    } catch (e) {
      console.error('Failed to add document to queue', e);
      // Don't fail the upload if queue fails, but maybe log it
    }

    res.status(201).json({ ...doc, fileHash, blockchainTx: version.blockchainTxHash });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await documentService.listDocuments(user.organizationId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { q, department, category } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Query parameter q is required' });
    }

    const filters: any = {};
    if (department) filters.department = department;
    if (category) filters.category = category;

    const searchResults = await aiClientService.search(q, user.organizationId, filters);
    
    if (!searchResults || searchResults.length === 0) {
        return res.json([]);
    }

    const docs = await documentService.listDocuments(user.organizationId); 
    const docsMap = new Map(docs.map(d => [d.id, d]));
    
    const finalResults = searchResults
        .map((r: any) => {
            const doc = docsMap.get(r.documentId);
            if (!doc) return null;
            return {
                ...doc,
                score: r.score,
                aiMetadata: {
                    department: r.department,
                    category: r.category
                }
            };
        })
        .filter((r: any) => r !== null);

    res.json(finalResults);
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const doc = await documentService.getDocumentById(req.params.id, user.organizationId);
    
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDocumentFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const user = req.user;

    const validation = validateFile(file as Express.Multer.File);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const doc = await documentService.getDocumentById(id, user.organizationId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const fileHash = calculateFileHash(file.buffer);
    const objectName = `${user.organizationId}/${uuidv4()}-${file.originalname}`;

    // Upload to MinIO
    await uploadFileStream(objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
        'x-amz-meta-original-name': file.originalname,
    });

    // Create New Version (This handles Blockchain Update)
    const newVersionNumber = doc.currentVersion + 1;
    const version = await versionService.createVersion(
      doc.id,
      newVersionNumber,
      objectName,
      fileHash,
      user.userId
    );

    // Update Document Metadata if provided (e.g. filename changes)
    await documentService.updateDocument(doc.id, {
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size
    });

    // Audit Log
    await auditService.logAction(
      AuditAction.UPDATE,
      user.userId,
      user.organizationId,
      doc.id,
      req.ip
    );

    res.json({ message: 'Document updated', version: newVersionNumber, blockchainTx: version.blockchainTxHash });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rollbackDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { version } = req.body;
    const user = req.user;

    const doc = await documentService.getDocumentById(id, user.organizationId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    await versionService.rollbackVersion(id, Number(version), user.userId);

    // Audit Log
    await auditService.logAction(
      AuditAction.ROLLBACK,
      user.userId,
      user.organizationId,
      doc.id,
      req.ip
    );

    res.json({ message: `Rolled back to version ${version}` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const doc = await documentService.getDocumentById(id, user.organizationId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    await documentService.deleteDocument(id);

    // Audit Log
    await auditService.logAction(
      AuditAction.DELETE,
      user.userId,
      user.organizationId,
      doc.id,
      req.ip
    );

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { version } = req.query;
    const user = req.user;

    const doc = await documentService.getDocumentById(id, user.organizationId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    let targetVersion;
    if (version) {
        targetVersion = await versionService.getVersion(id, Number(version));
    } else {
        targetVersion = await versionService.getVersion(id, doc.currentVersion);
    }

    if (!targetVersion) return res.status(404).json({ message: 'Version not found' });

    // Stream file from MinIO
    const dataStream = await getFileStream(targetVersion.storagePath);
    
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    
    dataStream.pipe(res);

    // Audit Log
    await auditService.logAction(
      AuditAction.DOWNLOAD,
      user.userId,
      user.organizationId,
      doc.id,
      req.ip
    );
  } catch (error: any) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
};

export const getDocumentVersions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const doc = await documentService.getDocumentById(id, user.organizationId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const versions = await versionService.getVersions(id);
    res.json(versions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 1. Get Document and Current Version
    const doc = await documentService.getDocumentById(id, user.organizationId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const currentVersion = await versionService.getVersion(id, doc.currentVersion);
    if (!currentVersion) return res.status(404).json({ message: 'Version not found' });

    // 2. Fetch File to re-calculate hash (Security measure)
    // Note: Ideally we store hash in DB and trust it, but re-calculating ensures file integrity on disk (MinIO) too.
    // However, downloading large files might be slow. For MVP, we use the hash stored in DB which was calculated at upload.
    const storedHash = currentVersion.fileHash;

    // 3. Verify with Blockchain
    const verification = await blockchainService.verifyDocumentIntegrity(id, storedHash);

    // 4. Update last verified time
    if (verification.verified) {
        await prisma.document.update({
            where: { id },
            data: { lastVerifiedAt: new Date() }
        });
    }

    res.json({
        documentId: id,
        version: currentVersion.versionNumber,
        isVerified: verification.verified,
        blockchainVersion: verification.version,
        storedHash: storedHash,
        lastVerifiedAt: new Date(),
        txHash: currentVersion.blockchainTxHash
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAuditCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Fetch DB Audit Logs
    const dbLogs = await prisma.auditLog.findMany({
        where: { documentId: id },
        orderBy: { timestamp: 'asc' },
        include: { user: true }
    });
    
    // Fetch Blockchain History
    const chainHistory = await blockchainService.getDocumentHistory(id);
    
    // Combine and format
    const certificateData = {
        documentId: id,
        generatedAt: new Date(),
        generatedBy: user.email,
        history: dbLogs.map(log => ({
            action: log.actionType,
            user: log.user.email,
            timestamp: log.timestamp,
            ip: log.ipAddress
        })),
        blockchainVerification: chainHistory
    };
    
    res.json(certificateData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
