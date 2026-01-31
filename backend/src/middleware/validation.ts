import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';

export const sanitizeInputs = [
  body('*').trim().escape(),
  query('*').trim().escape(),
  param('*').trim().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       // Just sanitization, not validation failure unless we add specific validators.
       // Ideally we just want to proceed with sanitized data.
       // However, escape() might alter data we don't want to alter (like JSON fields in body).
       // So a blanket escape might be too aggressive for JSON APIs receiving structured data.
       // Instead, let's just trim.
    }
    next();
  }
];

export const globalSanitizer = (req: Request, res: Response, next: NextFunction) => {
    // Manual deep trim/sanitize if needed, or rely on specific route validators.
    // For now, we will add a simple middleware that trims string inputs in body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
};
