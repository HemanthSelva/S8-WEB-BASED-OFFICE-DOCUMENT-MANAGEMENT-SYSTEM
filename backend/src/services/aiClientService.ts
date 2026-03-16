import axios from 'axios';
import prisma from '../utils/prisma';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'intellidocx-ai-secret-key';

export class AIClientService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      headers: {
        'X-API-Key': AI_SERVICE_API_KEY,
        'Content-Type': 'application/json',
      },
    });
  }

  async processDocument(documentId: string, organizationId: string, filePath: string, title?: string, fileName?: string) {
    try {
      const response = await this.client.post('/ai/process-document', {
        documentId,
        organizationId,
        filePath,
        title,
        fileName,
      });

      return response.data;
    } catch (error) {
      console.warn('AI Processing Warning: AI Service unreachable or failed. Using fallback data.');
      // Return fallback data instead of throwing to prevent worker crash
      return {
        department: 'General',
        category: 'Uncategorized',
        tags: ['auto-processed'],
        confidence: 0,
        summary: 'AI Service unavailable'
      };
    }
  }

  async search(query: string, organizationId: string, filters?: any) {
    try {
      const response = await this.client.post('/ai/search', {
        query,
        organizationId,
        limit: 20,
        filters,
      });

      return response.data.results;
    } catch (error) {
      console.error('AI Search Error:', error);
      throw new Error('Failed to search documents via AI service');
    }
  }

  async chat(documentId: string, organizationId: string, message: string, history: any[] = []) {
    try {
      const response = await this.client.post('/ai/chat', {
        documentId,
        organizationId,
        message,
        history,
      });

      return response.data;
    } catch (error) {
      console.error('AI Chat Error:', error);
      return {
        answer: 'I encountered an error while trying to process your request. Please try again later.',
        confidence: 0,
        source_found: false
      };
    }
  }
}

export const aiClientService = new AIClientService();
