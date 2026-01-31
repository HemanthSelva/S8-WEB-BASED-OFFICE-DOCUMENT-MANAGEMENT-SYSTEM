import prisma from '../utils/prisma';
import { blockchainService } from '../blockchain/blockchainService';

export const createVersion = async (
  documentId: string,
  versionNumber: number,
  storagePath: string,
  fileHash: string,
  uploadedById: string
) => {
  // 1. Blockchain Registration
  let txHash: string | null = null;
  if (versionNumber === 1) {
    txHash = await blockchainService.registerDocumentHash(documentId, fileHash, uploadedById);
  } else {
    txHash = await blockchainService.updateDocumentHash(documentId, fileHash, uploadedById);
  }

  // 2. Create the version record
  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber,
      storagePath,
      fileHash,
      blockchainTxHash: txHash || undefined, // Store tx hash if successful
      uploadedById,
    },
  });

  // 3. Update document current version and timestamp
  await prisma.document.update({
    where: { id: documentId },
    data: {
      currentVersion: versionNumber,
      updatedAt: new Date(),
    },
  });

  return version;
};

export const getVersions = async (documentId: string) => {
  return await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNumber: 'desc' },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
    },
  });
};

export const getVersion = async (documentId: string, versionNumber: number) => {
  return await prisma.documentVersion.findFirst({
    where: { documentId, versionNumber },
  });
};

export const rollbackVersion = async (documentId: string, targetVersion: number, userId: string) => {
  const version = await getVersion(documentId, targetVersion);
  if (!version) {
    throw new Error('Version not found');
  }

  // We don't delete history, we just update the current pointer.
  // Ideally, a rollback might be a "new version" that is a copy of the old one to preserve linear history.
  // But per requirements "Update currentVersion", we will just point back.
  
  // NOTE: If we just point back, the next "update" needs to know whether to increment from the rolled-back version or the absolute max version.
  // Usually, version control systems are append-only.
  // Requirement says: "Update currentVersion".
  
  // Note on Blockchain: Rolling back in DB doesn't rollback blockchain. 
  // We should ideally register a new version on blockchain that matches the old hash, but for now we just change the DB pointer.
  
  return await prisma.document.update({
    where: { id: documentId },
    data: {
      currentVersion: targetVersion,
      updatedAt: new Date(),
    },
  });
};
