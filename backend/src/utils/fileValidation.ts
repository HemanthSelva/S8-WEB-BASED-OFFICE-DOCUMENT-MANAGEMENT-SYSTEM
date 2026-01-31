const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
];

export const validateFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type' };
  }

  return { isValid: true };
};
