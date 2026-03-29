import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UploadCloud, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { api } from '@/api/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadModalProps {
  onUploadSuccess: () => void;
}

export const UploadModal = ({ onUploadSuccess }: UploadModalProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadState('idle');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadState('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadState('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      await api.post('/documents/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });

      setUploadState('success');
      toast({
        title: "Upload Successful",
        description: `${file.name} has been securely vaulted.`,
        className: "bg-green-500 text-white border-none"
      });
      
      setTimeout(() => {
        setOpen(false);
        setFile(null);
        setUploadState('idle');
        onUploadSuccess();
      }, 1500);

    } catch (error) {
      setUploadState('error');
      const err = error as any;
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.response?.data?.message || "There was a problem transferring the file.",
      });
    }
  };

  const circleLength = 283; // 2 * pi * 45
  const strokeDashoffset = circleLength - (progress / 100) * circleLength;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && uploadState === 'uploading') return; // Prevent closing while uploading
      setOpen(val);
      if (!val) {
        setTimeout(() => {
          setFile(null);
          setUploadState('idle');
          setProgress(0);
        }, 300);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/25 transition-all overflow-hidden relative group h-11 px-6 rounded-xl">
          <span className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
          <UploadCloud className="w-4 h-4 mr-2 group-hover:-translate-y-1 transition-transform duration-300" />
          Upload Document
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-center">Transfer Asset</DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {uploadState === 'idle' || uploadState === 'error' ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div
                  className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group
                    ${isDragOver 
                      ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[1.02]' 
                      : uploadState === 'error'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 outline-none animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Input id="file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  
                  <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${isDragOver ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10'}`}>
                    <UploadCloud className={`w-8 h-8 transition-colors duration-300 ${isDragOver ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-500'}`} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Upload Data Matrix</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Drag and drop your file here, or click to browse</p>
                  
                  {uploadState === 'error' && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-4 flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-100 dark:bg-rose-500/20 px-3 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Failed to process payload
                    </motion.div>
                  )}
                </div>

                {file && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 rounded-xl shrink-0">
                        <FileText className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); setUploadState('idle'); }} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={!file} 
                  className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 rounded-2xl transition-all shadow-lg shadow-slate-900/10"
                >
                  Initiate Transfer
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <div className="relative w-32 h-32 mb-6">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="45" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" fill="transparent" />
                    
                    {/* Progress Circle */}
                    <motion.circle 
                      cx="64" 
                      cy="64" 
                      r="45" 
                      className={`stroke-indigo-500 transition-all duration-300 ease-out`}
                      strokeWidth="6" 
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={circleLength}
                      strokeDashoffset={strokeDashoffset}
                      initial={{ strokeDashoffset: circleLength }}
                      animate={{ strokeDashoffset: uploadState === 'success' ? 0 : strokeDashoffset }}
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploadState === 'success' ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                        <CheckCircle2 className="w-10 h-10 text-indigo-500" />
                      </motion.div>
                    ) : (
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{progress}%</span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {uploadState === 'success' ? 'Transfer Complete!' : 'Establishing Uplink...'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
                  {uploadState === 'success' 
                    ? 'The asset has been successfully encoded into the core network.' 
                    : 'Applying encryption and running preliminary AI classifiers...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
