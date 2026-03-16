import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { api } from '@/api/client';
import { useToast } from '@/components/ui/use-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface DocumentChatProps {
    documentId: string;
    documentTitle: string;
    onClose: () => void;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
    documentId,
    documentTitle,
    onClose
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Hello! I'm your AI assistant for "${documentTitle}". How can I help you with this document today?`
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await api.post(`/documents/${documentId}/chat`, {
                message: userMessage,
                history: messages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.answer
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            toast({
                title: 'Error',
                description: 'Failed to get a response from the AI assistant.',
                variant: 'destructive',
            });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error while processing your request. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="fixed bottom-4 right-4 w-[400px] h-[600px] shadow-2xl flex flex-col z-50 border-primary/20 animate-in slide-in-from-right-10 duration-300">
            <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <CardTitle className="text-sm font-bold truncate max-w-[250px]">
                        AI Assistant: {documentTitle}
                    </CardTitle>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
                <div
                    ref={scrollRef}
                    className="flex-1 pr-4 overflow-y-auto custom-scrollbar"
                >
                    <div className="flex flex-col gap-4">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border border-primary/10 shrink-0 ${m.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'}`}>
                                        {m.role === 'assistant' ? <Bot size={16} className="text-primary" /> : <User size={16} />}
                                    </div>
                                    <div
                                        className={`rounded-lg p-3 text-sm shadow-sm ${m.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted/50 border border-muted rounded-tl-none'
                                            }`}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center border border-primary/10 bg-primary/10 shrink-0">
                                        <Bot size={16} className="text-primary" />
                                    </div>
                                    <div className="bg-muted/50 border border-muted rounded-lg rounded-tl-none p-3 flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground italic">AI is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 border-t bg-muted/20">
                <div className="flex w-full gap-2">
                    <Input
                        placeholder="Ask about this document..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                        className="flex-1 focus-visible:ring-primary/30"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="hover:scale-105 transition-transform"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};
