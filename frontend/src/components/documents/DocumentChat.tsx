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
        <>
            <div 
                className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm z-[100]"
                onClick={onClose}
            />
            <Card className="fixed top-0 right-0 w-full sm:w-[500px] h-full shadow-2xl flex flex-col z-[110] border-l border-white/10 rounded-none animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex flex-row items-center justify-between rounded-none shrink-0" style={{ margin: 0 }}>
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                        <div>
                            <CardTitle className="text-lg font-bold">IntelliBot Analysis</CardTitle>
                            <p className="text-white/80 text-xs font-medium truncate max-w-[280px]">Chatting about: {documentTitle}</p>
                        </div>
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
                        placeholder="Ask IntelliBot a specific question about this document..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-xl focus-visible:ring-indigo-500 bg-white dark:bg-slate-900 shadow-inner"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="h-12 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-transform shrink-0 shadow-lg shadow-indigo-500/20"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
        </>
    );
};
