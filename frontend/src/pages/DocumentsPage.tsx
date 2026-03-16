import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Document } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { useToast } from '@/components/ui/use-toast';
import { SearchFilters } from '@/components/documents/SearchFilters';
import { DocumentChat } from '@/components/documents/DocumentChat';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeChatDoc, setActiveChatDoc] = useState<{ id: string, title: string } | null>(null);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/documents');
      // The backend returns { data: Document[], total: number, page: number, ... }
      setDocuments(response.data.data || response.data);
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

  // Poll for document status if any are processing
  useEffect(() => {
    const hasProcessingDocs = documents.some(
      doc => doc.processingStatus === 'PROCESSING' || doc.processingStatus === 'PENDING'
    );

    if (hasProcessingDocs) {
      const interval = setInterval(() => {
        // We use a simplified fetch here to avoid constant loading spinners if possible
        // but for now, reusing fetchDocuments is safer
        fetchDocuments();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [documents]);

  const handleSearch = async (query: string, filters: any) => {
    setCurrentQuery(query);
    setCurrentFilters(filters);

    if (!query && !filters.department && !filters.category) {
      fetchDocuments();
      return;
    }
    setLoading(true);
    try {
      let url;
      if (!query) {
        // Use List Filtering (Backend now supports this)
        const params = new URLSearchParams();
        if (filters.department) params.append('department', filters.department);
        if (filters.category) params.append('category', filters.category);
        url = `/documents?${params.toString()}`;
      } else {
        // Use Semantic Search
        url = `/documents/search?q=${encodeURIComponent(query)}`;
        if (filters.department) url += `&department=${encodeURIComponent(filters.department)}`;
        if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
      }

      const response = await api.get(url);
      setDocuments(response.data.data || response.data);
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

  const handleDownloadAll = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (currentFilters.category) queryParams.append('category', currentFilters.category);
      if (currentFilters.department) queryParams.append('department', currentFilters.department);

      const response = await api.get(`/documents/download-all?${queryParams.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'documents.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Success", description: "All filtered documents started downloading." });
    } catch (error) {
      console.error('Download All failed', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download all documents",
      });
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

  const handlePreview = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download?inline=true`, { responseType: 'blob' });
      const contentType = response.headers['content-type'];
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      window.open(url, '_blank');
      // Revoke after a delay to ensure the new tab has time to load the blob
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Preview failed', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Preview failed",
      });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });

      // Create blob link to download
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'document';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length >= 2)
          fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadAll}>
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
          <DocumentUpload onUploadSuccess={fetchDocuments} />
        </div>
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
        onPreview={handlePreview}
        onChat={(id: string, title: string) => setActiveChatDoc({ id, title })}
      />

      {/* AI Chat Bot */}
      {activeChatDoc && (
        <DocumentChat
          documentId={activeChatDoc.id}
          documentTitle={activeChatDoc.title}
          onClose={() => setActiveChatDoc(null)}
        />
      )}

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
