// src/components/transactions/analyze-transactions-dialog.tsx

"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography
} from "@mui/material";
import { Wand2, Loader2 } from "lucide-react";
import { Transaction } from "@/lib/types";
import { analyzeTransactionsAction } from "@/services/ai-actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/mui-wrappers/scroll-area";
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
                toast({ variant: "error", title: "Erro na Análise", description: error.message || "Não foi possível analisar as transações." });
            }
        });
    }

    const handleClose = () => {
        setIsOpen(false);
        setAnalysis("");
    };

    return (
        <>
            <ProUpgradeButton requiredPlan="Pro" tooltipContent="Analise transações com IA no plano Pro.">
                <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                        setIsOpen(true);
                        handleAnalysis();
                    }} 
                    disabled={!user || !isPro || transactions.length === 0}
                >
                    <Wand2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                    Analisar com IA ({transactions.length})
                </Button>
            </ProUpgradeButton>

            <Dialog 
                open={isOpen} 
                onClose={handleClose}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Análise de Transações com IA</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        A IA analisou as transações selecionadas e encontrou os seguintes pontos:
                    </DialogContentText>
                    
                    <ScrollArea sx={{ height: '20rem', pr: 3 }}>
                        {isAnalyzing ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '10rem' }}>
                                 <Loader2 style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite' }} />
                            </Box>
                        ) : (
                            <Box sx={{ '& .prose': { fontSize: '0.875rem' } }}>
                                <ReactMarkdown>{analysis}</ReactMarkdown>
                            </Box>
                        )}
                    </ScrollArea>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
