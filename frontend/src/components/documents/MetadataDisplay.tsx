import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface MetadataDisplayProps {
    customFields?: Record<string, any>;
    category?: string;
}

export const MetadataDisplay = ({ customFields }: MetadataDisplayProps) => {
    if (!customFields || Object.keys(customFields).length === 0) {
        return null;
    }

    // Helper to format keys (e.g., totalAmount -> Total Amount)
    const formatKey = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    };

    const renderValue = (value: any) => {
        if (Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1 mt-1">
                    {value.map((v, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {String(v)}
                        </Badge>
                    ))}
                </div>
            );
        }
        return <span className="text-gray-900 font-medium">{String(value)}</span>;
    };

    return (
        <Card className="mt-2 bg-gray-50/50 border-gray-100 p-3 shadow-none">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Info className="w-3 h-3" />
                AI-Extracted Information
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                {Object.entries(customFields).map(([key, value]) => {
                    // Skip empty or null values
                    if (value === null || value === undefined || value === '') return null;

                    return (
                        <div key={key} className="flex flex-col">
                            <span className="text-[10px] text-gray-500 mb-0.5">{formatKey(key)}</span>
                            <div className="text-sm">
                                {renderValue(value)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
