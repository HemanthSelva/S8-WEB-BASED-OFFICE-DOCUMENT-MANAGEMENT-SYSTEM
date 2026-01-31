import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { aiClientService } from '../services/aiClientService';

export const searchDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { q, department, category } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Query parameter q is required' });
    }

    // Save Search History
    await prisma.searchHistory.create({
        data: {
            query: q,
            userId: user.userId
        }
    });

    const filters: any = {};
    if (department) filters.department = department;
    if (category) filters.category = category;

    const searchResults = await aiClientService.search(q, user.organizationId, filters);
    
    // Enrich with local document data (title, etc.)
    if (!searchResults || searchResults.length === 0) {
        return res.json([]);
    }

    const docIds = searchResults.map((r: any) => r.documentId);
    const docs = await prisma.document.findMany({
        where: { id: { in: docIds } }
    });
    const docsMap = new Map(docs.map(d => [d.id, d]));
    
    const finalResults = searchResults
        .map((r: any) => {
            const doc = docsMap.get(r.documentId);
            if (!doc) return null;
            return {
                ...doc,
                score: r.score,
                snippet: r.snippet,
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

export const saveSearch = async (req: AuthRequest, res: Response) => {
    try {
        const { name, query, filters } = req.body;
        const user = req.user;

        const saved = await prisma.savedSearch.create({
            data: {
                name,
                query,
                filters,
                userId: user.userId,
                organizationId: user.organizationId
            }
        });

        res.status(201).json(saved);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSavedSearches = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const searches = await prisma.savedSearch.findMany({
            where: { organizationId: user.organizationId, userId: user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(searches);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getRecentSearches = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const history = await prisma.searchHistory.findMany({
            where: { userId: user.userId },
            orderBy: { timestamp: 'desc' },
            take: 10,
            distinct: ['query'] // minimal distinct support if Prisma supports it, else handle in app
        });
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
