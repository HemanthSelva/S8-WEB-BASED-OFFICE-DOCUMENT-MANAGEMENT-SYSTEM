import Logger from '../utils/logger';

export const extractText = async (buffer: Buffer, mimeType: string): Promise<string> => {
    try {
        Logger.info(`[TextExtractor] Extracting text for mime: ${mimeType}`);

        if (mimeType === 'application/pdf') {
            console.log('[TextExtractor] Requiring pdf-parse...');
            const pdf = require('pdf-parse');
            console.log('[TextExtractor] Parsing PDF...');
            const data = await pdf(buffer);
            return normalizeText(data.text);
        }

        if (mimeType.startsWith('image/')) {
            Logger.info('[TextExtractor] Loading Tesseract for image OCR...');
            // Dynamic import to prevent crash if Tesseract fails to load in this environment
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(buffer);
            await worker.terminate();
            return normalizeText(text);
        }

        Logger.warn(`[TextExtractor] Unsupported mime type for text extraction: ${mimeType}`);
        return '';
    } catch (error: any) {
        Logger.error(`[TextExtractor] Error extracting text: ${error.message}`);
        return '';
    }
};

const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim()
        .slice(0, 100000); // Limit length to prevent DB issues
};
