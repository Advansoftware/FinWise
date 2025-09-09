// src/components/chat/chat-assistant.tsx
"use client";

import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Sparkles, X, Loader2, Gem } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTransactions } from "@/hooks/use-transactions";
import { useReports } from '@/hooks/use-reports';
import { getChatbotResponse } from '@/services/ai-actions';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/ai/ai-types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { getYear, startOfMonth } from 'date-fns';
import { usePlan } from '@/hooks/use-plan';
import Link from 'next/link';
import { ProUpgradeCard } from '../pro-upgrade-card';

const suggestionPrompts = [
    "Quanto gastei com Supermercado este mês?",
    "Como posso economizar no próximo mês?",
    "Quais foram minhas 5 maiores despesas?",
    "Liste minhas transações de Restaurante.",
];

export function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isPending, startTransition] = useTransition();
    const { allTransactions } = useTransactions();
    const { monthlyReports, annualReports } = useReports();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const { user, loading } = useAuth();
    const { isPro } = usePlan();

    useEffect(() => {
        // Scroll to bottom when new messages are added
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSubmit = (prompt: string = input) => {
        if (!prompt.trim() || !isPro) return;


        const newUserMessage: Message = { role: 'user', content: prompt };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');

        startTransition(async () => {
            try {
                const currentYear = getYear(new Date());
                const startOfCurrentMonth = startOfMonth(new Date());

                // Prepare data for the AI
                const currentMonthTransactions = allTransactions.filter(t => new Date(t.date) >= startOfCurrentMonth);
                const currentYearMonthlyReports = monthlyReports.filter(r => r.period.startsWith(currentYear.toString()));
                const pastAnnualReports = annualReports.filter(r => parseInt(r.period) < currentYear);

                const response = await getChatbotResponse({
                    history: messages,
                    prompt: prompt,
                    transactions: currentMonthTransactions,
                    monthlyReports: currentYearMonthlyReports,
                    annualReports: pastAnnualReports
                }, user!.uid);
                
                const newModelMessage: Message = { role: 'model', content: response };
                setMessages(prev => [...prev, newModelMessage]);
            } catch (error) {
                console.error('Error getting chatbot response:', error);
                const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar sua pergunta.";
                toast({
                    title: "Erro no Chat",
                    description: errorMessage,
                    variant: "destructive"
                });
                
                // Remover a mensagem do usuário se houve erro
                setMessages(prev => prev.filter(msg => msg !== newUserMessage));
            }
        });
    };
    
    const handleSuggestionClick = (prompt: string) => {
        handleSubmit(prompt);
    };

    const renderChatContent = () => {
        if (loading) {
            return (
                <div className="text-center p-4 flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                </div>
            );
        }

        if (!isPro) {
            return (
                <div className="p-4 h-full flex flex-col justify-center">
                    <ProUpgradeCard featureName="Assistente de Chat com IA" />
                </div>
            );
        }

        if (messages.length === 0) {
             return (
                <div className="text-center p-4">
                    <p className="text-muted-foreground mb-4">Faça uma pergunta sobre suas finanças ou escolha uma sugestão.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {suggestionPrompts.map(prompt => (
                            <Button key={prompt} variant="outline" size="sm" className="h-auto py-2" onClick={() => handleSuggestionClick(prompt)}>
                                <span className="text-wrap">{prompt}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
             <div className="p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                        <div className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isPending && (
                    <div className="flex gap-2 justify-start">
                        <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="rounded-lg px-3 py-2 bg-muted flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin text-primary"/>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="relative">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-20 right-0"
                    >
                        <Card className="w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] flex flex-col shadow-2xl bg-card/80 backdrop-blur-xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bot className="text-primary" />
                                    <CardTitle className="text-lg">Assistente Gastometria</CardTitle>
                                    {messages.length > 0 && <Badge variant="secondary">{messages.length}</Badge>}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden p-0">
                                <ScrollArea className="h-full" ref={scrollAreaRef}>
                                    {renderChatContent()}
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-4 border-t">
                                <div className="relative w-full">
                                    <Input
                                        placeholder={isPro ? "Pergunte algo sobre seus gastos..." : "Faça upgrade para usar o chat"}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        disabled={isPending || !isPro}
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                        onClick={() => handleSubmit()}
                                        disabled={!input.trim() || isPending || !isPro}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className="rounded-full shadow-lg w-14 h-14 md:w-16 md:h-16"
                onClick={() => setIsOpen(prev => !prev)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </Button>
        </div>
    );
}
