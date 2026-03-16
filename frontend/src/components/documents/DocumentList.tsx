import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ShieldCheck, History, Download, Trash2, Loader2, MessageSquare, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Document } from '@/types';
import { motion } from 'framer-motion';
import { MetadataDisplay } from './MetadataDisplay';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onPreview: (id: string) => void;
  onChat: (id: string, title: string) => void;
}

export const DocumentList = ({ documents, loading, onVerify, onDelete, onDownload, onPreview, onChat }: DocumentListProps) => {
  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    return <p className="text-center text-gray-500 py-8">No documents found.</p>;
  }

  return (
    <div className="grid gap-4">
      {documents.map((doc, index) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {doc.title}
                    {doc.processingStatus === 'PROCESSING' && (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing
                      </Badge>
                    )}
                    {doc.processingStatus === 'FAILED' && (
                      <Badge variant="destructive">Processing Failed</Badge>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ver {doc.currentVersion} • {format(new Date(doc.createdAt), 'PP')}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {doc.metadata?.category ? (
                      <Badge variant="outline" className="text-xs">
                        {doc.metadata.category}
                      </Badge>
                    ) : doc.category ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600 text-xs">
                          {doc.category}
                        </Badge>
                      </div>
                    ) : null}

                    {doc.metadata?.department && (
                      <Badge variant="outline" className="text-xs">
                        {doc.metadata.department}
                      </Badge>
                    )}

                    {doc.confidence && doc.confidence > 0 && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        {Math.round(doc.confidence * 100)}% Match
                      </Badge>
                    )}
                  </div>

                  {/* AI Metadata Display */}
                  <MetadataDisplay
                    customFields={doc.metadata?.customFields}
                    category={doc.metadata?.category || doc.category}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onVerify(doc.id)}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onPreview(doc.id)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDownload(doc.id)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => onChat(doc.id, doc.title)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(doc.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
