// src/components/budgets/automatic-budget-card.tsx
'use client';
import { useState, useTransition, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { generateAutomaticBudgetsAction } from "@/services/ai-actions";
import { useToast } from "@/hooks/use-toast";
import { AutomaticBudgetDialog } from "./automatic-budget-dialog";
import { BudgetItemSchema } from "@/ai/ai-types";
import { z } from "zod";
import { Box, Stack } from '@mui/material';

type SuggestedBudget = z.infer<typeof BudgetItemSchema>;

export function AutomaticBudgetCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { allTransactions } = useTransactions();
  const { budgets } = useBudgets();
  const [isGenerating, startGenerating] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suggestedBudgets, setSuggestedBudgets] = useState<SuggestedBudget[]>([]);
  
  const lastMonthTransactions = useMemo(() => {
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);

    return allTransactions.filter(t =>
      t.type === 'expense' &&
      new Date(t.date) >= lastMonthStart &&
      new Date(t.date) <= lastMonthEnd
    );
  }, [allTransactions]);

  const handleGenerate = () => {
    if (!user || lastMonthTransactions.length === 0) {
        toast({
            variant: "destructive",
            title: "Dados insuficientes",
            description: "Não há transações de despesa no mês passado para gerar orçamentos."
        })
        return;
    }

    startGenerating(async () => {
      try {
        const existingBudgetCategories = budgets.map(b => b.category);
        const result = await generateAutomaticBudgetsAction({
          lastMonthTransactions: JSON.stringify(lastMonthTransactions, null, 2),
          existingBudgets: JSON.stringify(existingBudgetCategories),
        }, user.uid);
        
        if (result.suggestedBudgets.length === 0) {
           toast({ title: "Nenhuma sugestão nova", description: "Parece que você já tem orçamentos para as principais categorias." });
           return;
        }

        setSuggestedBudgets(result.suggestedBudgets);
        setIsDialogOpen(true);

      } catch (error) {
        console.error("Error generating automatic budgets", error);
        toast({
            variant: "destructive",
            title: "Erro na Geração Automática",
            description: "Não foi possível gerar as sugestões. Verifique suas configurações de IA.",
        })
      }
    });
  }

  return (
    <>
        <AutomaticBudgetDialog 
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            suggestedBudgets={suggestedBudgets}
        />
        <Card sx={{ bgcolor: 'rgba(var(--primary-rgb), 0.1)', borderColor: 'rgba(var(--primary-rgb), 0.2)' }}>
        <CardHeader>
            <Box>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                    <CardTitle>
                        <Box component="span" sx={{ color: 'primary.main' }}>Orçamentos Automáticos</Box>
                    </CardTitle>
                </Stack>
            </Box>
            <CardDescription>
                <Box component="span" sx={{ color: 'rgba(var(--primary-rgb), 0.8)' }}>
                    Deixe a IA analisar seus gastos do mês passado e criar um plano de orçamento para você em segundos.
                </Box>
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} className="animate-spin"/>}
            Gerar Orçamentos com IA
            </Button>
        </CardContent>
        </Card>
    </>
  );
}
