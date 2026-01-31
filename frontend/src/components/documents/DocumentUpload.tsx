import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { api } from '@/api/client';
import { useToast } from '@/components/ui/use-toast';

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export const DocumentUpload = ({ onUploadSuccess }: DocumentUploadProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setOpen(false);
      setFile(null);
      onUploadSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Upload failed",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <span className="font-medium">{file.name}</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-gray-500">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p>Drag & drop or click to select file</p>
              </div>
            )}
            <Input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-gray-500">{progress}% Uploading...</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
