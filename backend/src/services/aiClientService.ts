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

  async processDocument(documentId: string, organizationId: string, filePath: string) {
    try {
      const response = await this.client.post('/ai/process-document', {
        documentId,
        organizationId,
        filePath,
      });

      return response.data;
    } catch (error) {
      console.error('AI Processing Error:', error);
      throw new Error('Failed to process document with AI service');
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
}

export const aiClientService = new AIClientService();
