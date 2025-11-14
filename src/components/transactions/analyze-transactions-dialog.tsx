// src/components/transactions/analyze-transactions-dialog.tsx

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
import { Wand2, Loader2, Lock } from "lucide-react";
import { Transaction } from "@/lib/types";
import { analyzeTransactionsAction } from "@/services/ai-actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import { useAuth } from "@/hooks/use-auth";
import { ProUpgradeButton } from "../pro-upgrade-button";
import { usePlan } from "@/hooks/use-plan";

interface AnalyzeTransactionsDialogProps {
    transactions: Transaction[];
}

export function AnalyzeTransactionsDialog({ transactions }: AnalyzeTransactionsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [isAnalyzing, startAnalyzing] = useTransition();
    const { toast } = useToast();
    const { user } = useAuth();
    const { isPro } = usePlan();

    const handleAnalysis = async () => {
        if (transactions.length === 0 || !user || !isPro) return;
        
        startAnalyzing(async () => {
            try {
                const result = await analyzeTransactionsAction(transactions, user.uid);
                setAnalysis(result);
            } catch (error: any) {
                console.error("Analysis error:", error);
                toast({ variant: "destructive", title: "Erro na Análise", description: error.message || "Não foi possível analisar as transações." });
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setAnalysis("")}}>
            <ProUpgradeButton requiredPlan="Pro" tooltipContent="Analise transações com IA no plano Pro.">
              <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => handleAnalysis()} disabled={!user || !isPro || transactions.length === 0}>
                      <Wand2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                      Analisar com IA ({transactions.length})
                  </Button>
              </DialogTrigger>
            </ProUpgradeButton>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Análise de Transações com IA</DialogTitle>
                    <DialogDescription>
                        A IA analisou as transações selecionadas e encontrou os seguintes pontos:
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea sx={{ maxHeight: '20rem', my: 4, pr: 6, '& .prose': { fontSize: '0.875rem' } }}>
                    {isAnalyzing ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '10rem' }}>
                             <Loader2 style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
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
