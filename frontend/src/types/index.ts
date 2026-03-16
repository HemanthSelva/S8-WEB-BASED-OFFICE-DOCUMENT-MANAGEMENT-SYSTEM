export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER';
  organizationId: string;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  currentVersion: number;
  metadata?: {
    department?: string;
    category?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  // Classification
  category?: string;
  confidence?: number;
  extractedText?: string;
}

export interface WorkflowInstance {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  currentStep: number;
  documentId: string;
  document: Document;
}

export interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'WORKFLOW' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
