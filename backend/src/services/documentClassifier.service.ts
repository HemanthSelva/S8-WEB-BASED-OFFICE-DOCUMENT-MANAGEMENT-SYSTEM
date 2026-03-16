import Logger from '../utils/logger';

interface ClassificationResult {
    category: string;
    confidence: number;
}

// Keywords for Phase 1 Rule-based classification
const KEYWORDS: Record<string, string[]> = {
    'INVOICE': ['invoice', 'bill to', 'amount due', 'total', 'tax', 'gst', 'payment terms', 'due date'],
    'RESUME': ['resume', 'curriculum vitae', 'experience', 'education', 'skills', 'objective', 'references'],
    'CONTRACT': ['agreement', 'contract', 'parties', 'witness', 'clause', 'terms and conditions', 'signature'],
    'REPORT': ['report', 'abstract', 'introduction', 'methodology', 'conclusion', 'analysis', 'summary'],
    'LETTER': ['dear', 'sincerely', 'regarding', 'subject', 'yours truly']
};

export const classifyDocument = async (text: string): Promise<ClassificationResult> => {
    try {
        if (!text || text.length < 10) {
            return { category: 'OTHER', confidence: 0 };
        }

        const scores: Record<string, number> = {};

        // Calculate frequency of keywords for each category
        for (const [category, words] of Object.entries(KEYWORDS)) {
            let matchCount = 0;
            words.forEach(word => {
                // Simple regex to match whole words preferred, but includes checks for flexibility
                if (text.includes(word)) {
                    matchCount++;
                }
            });
            // Normalize score by number of keywords checked (simple heuristic)
            scores[category] = matchCount / words.length;
        }

        // Find best match
        let bestCategory = 'OTHER';
        let maxScore = 0;

        for (const [category, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }

        // Confidence scaling (heuristic)
        // If we matched more than 20% of keywords, high confidence.
        let confidence = Math.min(maxScore * 3, 0.95);

        if (confidence < 0.2) {
            bestCategory = 'OTHER';
            confidence = 0;
        }

        Logger.info(`[Classifier] Classified as ${bestCategory} with confidence ${confidence}`);
        return { category: bestCategory, confidence };

    } catch (error: any) {
        Logger.error(`[Classifier] Error classifying document: ${error.message}`);
        return { category: 'OTHER', confidence: 0 };
    }
};
