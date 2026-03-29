import { memo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Download, Trash2, Eye, ShieldCheck, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document } from '@/types';
import { Progress } from '@/components/ui/progress';

interface DocumentCardProps {
  document: Document;
  index: number;
  onDownload: (id: string) => void;
  onPreview: (id: string) => void;
  onVerify: (id: string, title: string) => void;
  onChat: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export const DocumentCard = memo(({ document, index, onDownload, onPreview, onVerify, onChat, onDelete }: DocumentCardProps) => {
  const getFileIconColor = (type: string | undefined) => {
    if (!type) return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    if (type.includes('pdf')) return 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
    if (type.includes('word') || type.includes('docx')) return 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
    if (type.includes('image') || type.includes('png') || type.includes('jpg')) return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  };

  const extension = document.title.split('.').pop()?.toUpperCase() || 'FILE';
  const category = document.metadata?.category || document.category || 'UNCLASSIFIED';
  const isVerified = document.blockchainHash && document.blockchainHash.length > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 via-indigo-500/0 to-indigo-500/10 dark:from-indigo-500/0 dark:via-indigo-500/0 dark:to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
      
      <div className="h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-400 ease-out flex flex-col justify-between overflow-hidden relative">
        
        {/* Top Header Section */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3 w-full pr-8">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-inner ${getFileIconColor(document.mimeType)}`}>
              {extension.substring(0, 3)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white truncate text-base hover:text-indigo-600 transition-colors" title={document.title}>{document.title}</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {((document.fileSize || 0) / 1024 / 1024).toFixed(2)} MB • Ver {document.currentVersion}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => onVerify(document.id, document.title)}
            className="absolute right-0 top-0 p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm"
            title={isVerified ? "Secured on Blockchain" : "Verify Integrity"}
          >
            {isVerified ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Middle AI Classification */}
        <div className="my-4 space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              {category}
            </div>
            {document.processingStatus === 'PROCESSING' && (
              <div className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center gap-1 animate-pulse">
                PROCESSING
              </div>
            )}
            {document.processingStatus === 'COMPLETED' && (
              <div className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                COMPLETED
              </div>
            )}
          </div>
          
          {document.confidence !== undefined && document.confidence > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> AI Confidence</span>
                <span className={
                  document.confidence >= 0.8 ? 'text-emerald-500' :
                  document.confidence >= 0.6 ? 'text-amber-500' : 'text-rose-500'
                }>{Math.round(document.confidence * 100)}%</span>
              </div>
              <Progress 
                value={document.confidence * 100} 
                className={`h-1.5 bg-slate-100 dark:bg-slate-800`}
                indicatorClassName={
                  document.confidence >= 0.8 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                  document.confidence >= 0.6 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 
                  'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                }
              />
            </div>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {document.uploadedBy?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 leading-tight">
              Added {format(new Date(document.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 flex items-end justify-center p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
          <div className="flex items-center gap-2 w-full max-w-[200px] justify-center">
            <Button size="icon" variant="secondary" className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 shadow-sm" onClick={() => onPreview(document.id)} title="Preview">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-400 shadow-sm" onClick={() => onChat(document.id, document.title)} title="AI Chat Analyze">
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 shadow-sm" onClick={() => onDownload(document.id)} title="Download Source">
              <Download className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 shadow-sm" onClick={() => onDelete(document.id)} title="Delete Vault">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DocumentCard.displayName = "DocumentCard";
