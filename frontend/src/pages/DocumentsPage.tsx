import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';
import { Document } from '@/types';
import { Search, Grid, List as ListIcon, ChevronRight } from 'lucide-react';
import { UploadModal } from '@/components/documents/UploadModal';
import { DocumentGrid } from '@/components/documents/DocumentGrid';
import { DocumentList } from '@/components/documents/DocumentList';
import { useToast } from '@/components/ui/use-toast';
import { DocumentChat } from '@/components/documents/DocumentChat';
import { BlockchainSecurityModal } from '@/components/documents/BlockchainSecurityModal';
import { DeleteConfirmationModal } from '@/components/documents/DeleteConfirmationModal';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { motion, AnimatePresence } from 'framer-motion';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVerifyDoc, setActiveVerifyDoc] = useState<{ id: string, title: string } | null>(null);
  const [activeChatDoc, setActiveChatDoc] = useState<{ id: string, title: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ id: string, title: string, mimeType: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean, id: string, title: string }>({ isOpen: false, id: '', title: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { toast } = useToast();

  const filterChips = ['All', 'Invoices', 'Contracts', 'Resumes', 'Reports', 'Legal'];

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/documents');
      setDocuments(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch workspace topology." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Real-time Semantic Debounce Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery && activeFilter === 'All') {
        fetchDocuments();
        return;
      }
      setLoading(true);
      try {
        let url = `/documents/search?q=${encodeURIComponent(searchQuery)}`;
        if (activeFilter !== 'All') {
          url += `&category=${encodeURIComponent(activeFilter.toUpperCase())}`;
        }
        // Fallback to strict listing if query is utterly empty
        if (!searchQuery) {
          url = `/documents?category=${encodeURIComponent(activeFilter.toUpperCase())}`;
        }
        
        const response = await api.get(url);
        setDocuments(response.data.data || response.data);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, fetchDocuments]);

  const handleVerify = (id: string, title: string) => setActiveVerifyDoc({ id, title });
  const handleChat = (id: string, title: string) => setActiveChatDoc({ id, title });

  const handleDelete = (id: string, title: string) => {
    setDeleteDialog({ isOpen: true, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/documents/${deleteDialog.id}`);
      toast({ title: "Asset Purged", description: "Document deleted from secure storage.", className: "bg-slate-900 text-white border-0" });
      setDocuments(prev => prev.filter(d => d.id !== deleteDialog.id));
      setDeleteDialog({ isOpen: false, id: '', title: '' });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete sequence aborted." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setPreviewDoc({ id, title: doc.title, mimeType: doc.mimeType || 'application/octet-stream' });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'classified-asset';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length >= 2) fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="max-w-[1600px] mx-auto pb-12"
    >
      {/* Dynamic Header */}
      <motion.div variants={slideUp} className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2">
            Workspace <ChevronRight className="w-4 h-4" /> 
            <span className="text-indigo-600 dark:text-indigo-400">Secure Vault</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight relative inline-block">
            Documents
            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full scale-transform origin-left transition-transform duration-700 ease-out" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-4 max-w-xl leading-relaxed">
            Manage, search and orchestrate telemetry across your intelligent enterprise vault with seamless AI integration.
          </p>
        </div>
        
        <div className="shrink-0 flex gap-3">
          <UploadModal onUploadSuccess={fetchDocuments} />
        </div>
      </motion.div>

      {/* Control Surface (Search, Filter, View) */}
      <motion.div variants={slideUp} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm mb-8 space-y-4">
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Query semantic graph, content, or metadata..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-12 bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-white transition-all shadow-inner"
            />
          </div>
          
          <div className="flex items-center bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50 w-full md:w-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex-1 md:w-12 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 md:w-12 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterChips.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeFilter === chip 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 scale-105 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Primary Rendering Surface */}
      <motion.div variants={slideUp} className="relative min-h-[50vh]">
        <AnimatePresence mode="wait">
          {documents.length === 0 && !loading ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No documents found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs">
                We couldn't find any assets matching "{searchQuery}". Try a different query or adjust your filters.
              </p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div key="grid-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <DocumentGrid 
                documents={documents} loading={loading} onVerify={handleVerify} onDelete={(id) => {
                  const doc = documents.find(d => d.id === id);
                  handleDelete(id, doc?.title || 'Unknown');
                }} onDownload={handleDownload} onPreview={handlePreview} onChat={handleChat}
              />
            </motion.div>
          ) : (
            <motion.div key="list-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
              <DocumentList 
                documents={documents} loading={loading} onVerify={handleVerify} onDelete={(id) => {
                  const doc = documents.find(d => d.id === id);
                  handleDelete(id, doc?.title || 'Unknown');
                }} onDownload={handleDownload} onPreview={handlePreview} onChat={handleChat}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Chat Drawer Slide */}
      <AnimatePresence>
        {activeChatDoc && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveChatDoc(null)}
              className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity" 
            />
            <div className="fixed inset-y-0 right-0 z-50 flex">
              <DocumentChat
                documentId={activeChatDoc.id}
                documentTitle={activeChatDoc.title}
                onClose={() => setActiveChatDoc(null)}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      <BlockchainSecurityModal
        documentId={activeVerifyDoc?.id || ''}
        documentTitle={activeVerifyDoc?.title || ''}
        isOpen={!!activeVerifyDoc}
        onClose={() => setActiveVerifyDoc(null)}
      />
      <DeleteConfirmationModal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={confirmDelete}
        title={deleteDialog.title}
        isDeleting={isDeleting}
      />
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        documentId={previewDoc?.id || ''}
        documentTitle={previewDoc?.title || ''}
        mimeType={previewDoc?.mimeType || ''}
        onDownload={handleDownload}
      />
    </motion.div>
  );
};
