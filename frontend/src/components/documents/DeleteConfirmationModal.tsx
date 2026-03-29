import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, isDeleting }: DeleteConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  Purge Asset?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Are you strictly certain you wish to delete <span className="text-slate-900 dark:text-white font-bold break-all">"{title}"</span>? This action is irreversible and will purge it from the secure vault.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <Button 
                    variant="destructive" 
                    className="h-14 rounded-2xl font-bold text-lg shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                    onClick={onConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Purging...
                      </div>
                    ) : (
                      'Delete Forever'
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    Keep Asset
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 px-8 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/50">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Global Storage Purge Protocol
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
