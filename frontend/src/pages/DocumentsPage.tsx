import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Document } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { useToast } from '@/components/ui/use-toast';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch documents",
      });
    } finally {
      setLoading(false);
    }
  };

import { SearchFilters } from '@/components/documents/SearchFilters';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch documents",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = async (query: string, filters: any) => {
    if (!query && !filters.department && !filters.category) {
        fetchDocuments();
        return;
    }
    setLoading(true);
    try {
        let url = `/documents/search?q=${encodeURIComponent(query)}`;
        if (filters.department) url += `&department=${encodeURIComponent(filters.department)}`;
        if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
        
        const response = await api.get(url);
        setDocuments(response.data);
    } catch (error) {
        console.error('Search failed', error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Search failed",
        });
    } finally {
        setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
      try {
          const response = await api.get(`/documents/${id}/verify`);
          setVerifyResult(response.data);
      } catch (error) {
          console.error('Verification failed', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Verification failed",
          });
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this document?')) return;
      try {
          await api.delete(`/documents/${id}`);
          toast({
            title: "Success",
            description: "Document deleted",
          });
          fetchDocuments();
      } catch (error) {
          console.error('Delete failed', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Delete failed",
          });
      }
  };

  const handleDownload = async (id: string) => {
      try {
          // This assumes the API returns a blob or we handle the redirect
          // Ideally, we get a presigned URL or use window.open
          // For now, let's try window.open with the token if possible, or use API blob download
          const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
          
          // Create blob link to download
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          const contentDisposition = response.headers['content-disposition'];
          let fileName = 'document';
          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (fileNameMatch.length === 2)
                fileName = fileNameMatch[1];
          }
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (error) {
          console.error('Download failed', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Download failed",
          });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Document Management</h1>
        <DocumentUpload onUploadSuccess={fetchDocuments} />
      </div>

      {/* Search Bar */}
      <SearchFilters onSearch={handleSearch} />

      {/* Document List */}
      <DocumentList 
        documents={documents} 
        loading={loading} 
        onVerify={handleVerify}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />

      {/* Verification Modal */}
      <Dialog open={!!verifyResult} onOpenChange={() => setVerifyResult(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Blockchain Verification</DialogTitle>
              </DialogHeader>
              {verifyResult && (
                  <div className="space-y-4">
                      <div className={`p-4 rounded-lg flex items-center gap-2 ${verifyResult.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {verifyResult.isVerified ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          <span className="font-semibold">{verifyResult.isVerified ? 'Verified Authentic' : 'Verification Failed'}</span>
                      </div>
                      <div className="text-sm space-y-2">
                          <p><strong>Document ID:</strong> {verifyResult.documentId}</p>
                          <p><strong>Blockchain Tx:</strong> <span className="font-mono text-xs">{verifyResult.txHash}</span></p>
                          <p><strong>Stored Hash:</strong> <span className="font-mono text-xs truncate block">{verifyResult.storedHash}</span></p>
                          <p><strong>Verified At:</strong> {format(new Date(verifyResult.lastVerifiedAt), 'PPpp')}</p>
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
};
