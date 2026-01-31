import crypto from 'crypto';

export const calculateFileHash = (buffer: Buffer): string => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(buffer);
  return hashSum.digest('hex');
};
