
"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { Transaction } from "@/lib/types";
import { analyzeTransactions } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import { useAuth } from "@/hooks/use-auth";

interface AnalyzeTransactionsDialogProps {
    transactions: Transaction[];
}

export function AnalyzeTransactionsDialog({ transactions }: AnalyzeTransactionsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [isAnalyzing, startAnalyzing] = useTransition();
    const { toast } = useToast();
    const { user } = useAuth();

    const handleAnalysis = async () => {
        if (transactions.length === 0 || !user) return;
        
        startAnalyzing(async () => {
            try {
                const result = await analyzeTransactions(transactions, user.uid);
                setAnalysis(result);
            } catch (error) {
                console.error("Analysis error:", error);
                toast({ variant: "destructive", title: "Erro na Análise", description: "Não foi possível analisar as transações." });
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setAnalysis("")}}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => handleAnalysis()} disabled={!user}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Analisar com IA ({transactions.length})
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Análise de Transações com IA</DialogTitle>
                    <DialogDescription>
                        A IA analisou as transações selecionadas e encontrou os seguintes pontos:
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-80 my-4 pr-6 prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:my-2">
                    {isAnalyzing ? (
                        <div className="flex items-center justify-center h-40">
                             <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        </div>
                    ) : (
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={() => setIsOpen(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
