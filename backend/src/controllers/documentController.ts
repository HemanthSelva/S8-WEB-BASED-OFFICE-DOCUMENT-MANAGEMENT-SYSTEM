import { Request, Response } from 'express';
import archiver from 'archiver';
import * as documentService from '../services/documentService';
import * as versionService from '../services/versionService';
import * as auditService from '../services/auditService';
import { aiClientService } from '../services/aiClientService';
import { blockchainService } from '../blockchain/blockchainService';
import { uploadFileStream, getFileStream, BUCKET_NAME } from '../storage/minioClient';
import { calculateFileHash } from '../utils/hash';
import { validateFile } from '../utils/fileValidation';
import { AuthRequest } from '../middleware/auth';
import { AuditAction, WorkflowStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { addDocumentJob } from '../services/queueService';
import { io } from '../app';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    console.log('[Upload Debug] Incoming file:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file');
    console.log('[Upload Debug] Incoming body:', req.body);

    const { title, description, department, category, tags } = req.body;
    const user = req.user;

    // Validate file
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const validation = validateFile(file as Express.Multer.File);
    console.log('[Upload Debug] Validation result:', validation);

    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    console.log('[Upload Debug] File buffer size:', file.buffer.length);

    let fileHash = '';
    let objectName = '';
    let extractedText = '';
    let classification = { category: 'OTHER', confidence: 0 };

    console.log('[Upload Debug] Calculating hash...');
    try {
      fileHash = calculateFileHash(file.buffer);
      console.log('[Upload Debug] Hash calculated:', fileHash);
      objectName = `${user.organizationId}/${uuidv4()}-${file.originalname}`;

      console.log('[Upload Debug] Uploading to MinIO...', objectName);
      // Upload to MinIO
      await uploadFileStream(objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
        'x-amz-meta-original-name': file.originalname,
      });
      console.log('[Upload Debug] MinIO upload complete');
    } catch (err) {
      console.error('[Upload Debug] Critical error in upload flow:', err);
      throw err;
    }

    // AI Classification will be handled by the background worker via aiClientService
    console.log('[Upload Debug] AI processing queued for background worker');

    // try {
    //   ... (commented out text extraction)
    // } catch (e) { ... }

    // Create Document in DB
    console.log('[Upload Debug] Creating DB record...');
    const doc = await documentService.createDocument({
      title: title || file.originalname,
      description,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size || file.buffer.length, // Ensure actual size is captured
      ownerId: user.userId,
      organizationId: user.organizationId,
      extractedText: extractedText || undefined,
      category: classification.category,
      confidence: classification.confidence
    }, objectName);

    // Create Metadata
    if (department || category || tags || classification.category) {
      await documentService.createMetadata(doc.id, {
        department,
        category: category || classification.category, // Use auto-classified if not provided
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      });
    }

    // BUG 2 — Auto-trigger Workflow (Step 3) - COMPLETELY UPDATED
    try {
      // Find active workflow template for this org
      const template = await prisma.workflowTemplate.findFirst({
        where: { 
          organizationId: user.organizationId,
          isActive: true 
        },
        include: { 
          steps: { orderBy: { order: 'asc' } },
          slaConfig: true
        }
      });
      
      if (template) {
        const slaHours = template.slaConfig?.maxApprovalHours || template.slaHours || 48;
        await prisma.workflowInstance.create({
          data: {
            documentId: doc.id,
            templateId: template.id,
            organizationId: user.organizationId,
            status: WorkflowStatus.PENDING,
            currentStepIndex: 0,
            startedById: user.userId,
            dueDate: new Date(Date.now() + slaHours * 60 * 60 * 1000)
          }
        });
        console.log('[Workflow] Auto-triggered for document:', doc.id);
      }
    } catch (workflowError) {
      console.error('[Workflow] Trigger failed:', workflowError);
      // Don't fail the upload if workflow trigger fails
    }

    // Note: Automatic Workflow Trigger will be moved to after AI processing in the worker 
    // to ensure it triggers based on accurate classification.

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
      await addDocumentJob(doc.id, objectName, user.organizationId, title || file.originalname, file.originalname);
    } catch (e) {
      console.error('Failed to add document to queue', e);
      // Don't fail the upload if queue fails, but maybe log it
    }

    // Emit Real-Time Event
    io.to(`org:${user.organizationId}`).emit('document:uploaded', {
      documentId: doc.id,
      name: doc.title,
      uploadedBy: user.name || user.email || 'Unknown User'
    });

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

    const { category, department } = req.query;
    const filters = {
      category: typeof category === 'string' ? category : undefined,
      department: typeof department === 'string' ? department : undefined
    };

    const result = await documentService.listDocuments(user.organizationId, page, limit, filters);
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
      // Fallback: Keyword Search via Prisma
      const keywordDocs = await prisma.document.findMany({
        where: {
          organizationId: user.organizationId,
          status: { not: 'DELETED' },
          OR: [
            { title: { contains: q as string, mode: 'insensitive' } },
            { fileName: { contains: q as string, mode: 'insensitive' } },
            { category: { contains: q as string, mode: 'insensitive' } }
          ]
        },
        include: {
          owner: { select: { id: true, name: true } },
          metadata: true
        },
        take: 20
      });

      return res.json(keywordDocs.map(d => ({
        ...d,
        score: 1.0, // Default score for keyword matches
        isKeywordMatch: true
      })));
    }

    const docIds = searchResults.map((r: any) => r.documentId);
    const docs = await prisma.document.findMany({
      where: {
        id: { in: docIds },
        organizationId: user.organizationId,
        status: { not: 'DELETED' }
      },
      include: {
        owner: { select: { id: true, name: true } },
        metadata: true
      }
    });
    const docsMap = new Map(docs.map(d => [d.id, d]));

    const finalResults = searchResults
      .map((r: any) => {
        const doc = docsMap.get(r.documentId);
        if (!doc) return null;
        return {
          ...(doc as any),
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

    // RBAC + Ownership Check:
    // Employees can only request deletion of their own documents
    if (user.role === 'EMPLOYEE' && doc.ownerId !== user.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own documents' });
    }

    // Admins and Managers can delete directly, others go through approval
    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
      // 1. Delete from MinIO first if storage path is available
      try {
        const latestVersion = await prisma.documentVersion.findFirst({
          where: { documentId: id },
          orderBy: { versionNumber: 'desc' }
        });
        
        if (latestVersion?.storagePath) {
          const { deleteFile } = await import('../storage/minioClient');
          // Perform delete with try-catch to ensure DB purge continues even if MinIO fails
          try {
            await deleteFile(latestVersion.storagePath);
            console.log(`[Delete] File ${latestVersion.storagePath} removed from MinIO`);
          } catch (storageErr: any) {
            console.warn(`[Delete] MinIO file deletion failed: ${storageErr.message}. Proceeding with database purge.`);
          }
        }
      } catch (minioErr: any) {
        console.error('[Delete] Storage version lookup failed:', minioErr);
        // Continue with DB delete even if lookup fails
      }

      // 2. Delete from DB (Hard delete as requested by user: "deleted from MinIO AND PostgreSQL")
      // Note: Relation constraints might require multi-step delete or CASCADE.
      // We'll perform a soft delete first then hard delete if needed, 
      // but the user's prompt "both must be deleted" implies hard delete.
      await prisma.$transaction([
        prisma.documentMetadata.deleteMany({ where: { documentId: id } }),
        prisma.documentVersion.deleteMany({ where: { documentId: id } }),
        prisma.document.delete({ where: { id } })
      ]);

      // Audit Log
      await auditService.logAction(
        AuditAction.DELETE,
        user.userId,
        user.organizationId,
        id,
        req.ip
      );

      // Emit Real-Time Event
      io.to(`org:${user.organizationId}`).emit('document:deleted', {
        documentId: id
      });

      return res.status(204).send();
    }

    // Non-admin users: create approval request
    const { requestApproval } = await import('../services/approvalService');
    const approval = await requestApproval({
      actionType: 'DELETE_DOCUMENT',
      entityType: 'DOCUMENT',
      entityId: id,
      requestedById: user.userId,
      organizationId: user.organizationId,
      reason: req.body.reason || 'Document deletion requested',
      metadata: { documentTitle: doc.title, fileName: doc.fileName },
    });

    res.status(202).json({ 
      message: 'Deletion request submitted for approval',
      approvalId: approval.id,
      status: 'PENDING_APPROVAL'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { version, inline } = req.query;
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

    const disposition = inline === 'true' ? 'inline' : 'attachment';
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename="${doc.fileName}"`);

    dataStream.pipe(res);

    // Audit Log (Only log download if it's an actual download, not just a preview viewing)
    if (disposition === 'attachment') {
      await auditService.logAction(
        AuditAction.DOWNLOAD,
        user.userId,
        user.organizationId,
        doc.id,
        req.ip
      );
      
      // Phase 4: Blockchain Access Logging
      await blockchainService.logDocumentAccess(doc.id, user.userId, 'DOWNLOAD');
    } else {
      // Log view access on blockchain too
      await blockchainService.logDocumentAccess(doc.id, user.userId, 'VIEW');
    }
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
      txHash: currentVersion.blockchainTxHash,
      blockchainAvailable: blockchainService.isAvailable()
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

export const downloadAllDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { category, department } = req.query;

    const filters = {
      category: typeof category === 'string' ? category : undefined,
      department: typeof department === 'string' ? department : undefined
    };

    console.log('[BulkDownload] Filters:', filters);

    // Fetch documents (limit 100 for safety in MVP)
    const result = await documentService.listDocuments(user.organizationId, 1, 100, filters);

    console.log('[BulkDownload] Found:', result.total);

    if (result.total === 0) {
      return res.status(404).json({ message: 'No documents found to download' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('documents.zip');
    archive.pipe(res);

    for (const doc of result.data) {
      try {
        const currentVersion = await versionService.getVersion(doc.id, doc.currentVersion);
        if (currentVersion) {
          const fileStream = await getFileStream(currentVersion.storagePath);
          archive.append(fileStream, { name: doc.fileName });
        }
      } catch (err) {
        console.error(`Failed to add document ${doc.id} to archive:`, err);
      }
    }

    await archive.finalize();

  } catch (error: any) {
    console.error('Bulk download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to create zip archive' });
    }
  }
};

export const chatWithDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message, history } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Verify document exists and belongs to organization
    const doc = await documentService.getDocumentById(id, user.organizationId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const result = await aiClientService.chat(id, user.organizationId, message, history || []);

    // Audit Log
    await auditService.logAction(
      AuditAction.AI_CHAT,
      user.userId,
      user.organizationId,
      doc.id,
      req.ip
    );

    res.json(result);
  } catch (error: any) {
    console.error('AI Chat Controller Error:', error);
    res.status(500).json({ message: 'Failed to process AI chat request' });
  }
};
