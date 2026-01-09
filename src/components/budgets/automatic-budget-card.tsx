// src/components/budgets/automatic-budget-card.tsx
"use client";
import { useState, useTransition, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Stack,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { generateAutomaticBudgets } from "@/services/ai-service-router";
import { useToast } from "@/hooks/use-toast";
import { AutomaticBudgetDialog } from "./automatic-budget-dialog";
import { BudgetItemSchema } from "@/ai/ai-types";
import { z } from "zod";

type SuggestedBudget = z.infer<typeof BudgetItemSchema>;

export function AutomaticBudgetCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { allTransactions } = useTransactions();
  const { budgets } = useBudgets();
  const [isGenerating, startGenerating] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suggestedBudgets, setSuggestedBudgets] = useState<SuggestedBudget[]>(
    []
  );

  const lastMonthTransactions = useMemo(() => {
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);

    return allTransactions.filter(
      (t) =>
        t.type === "expense" &&
        new Date(t.date) >= lastMonthStart &&
        new Date(t.date) <= lastMonthEnd
    );
  }, [allTransactions]);

  const handleGenerate = () => {
    if (!user || lastMonthTransactions.length === 0) {
      toast({
        variant: "error",
        title: "Dados insuficientes",
        description:
          "Não há transações de despesa no mês passado para gerar orçamentos.",
      });
      return;
    }

    startGenerating(async () => {
      try {
        const existingBudgetCategories = budgets.map((b) => b.category);
        const result = await generateAutomaticBudgets(
          {
            lastMonthTransactions: JSON.stringify(
              lastMonthTransactions,
              null,
              2
            ),
            existingBudgets: JSON.stringify(existingBudgetCategories),
          },
          user.uid
        );

        if (result.suggestedBudgets.length === 0) {
          toast({
            title: "Nenhuma sugestão nova",
            description:
              "Parece que você já tem orçamentos para as principais categorias.",
          });
          return;
        }

        setSuggestedBudgets(result.suggestedBudgets);
        setIsDialogOpen(true);
      } catch (error) {
        console.error("Error generating automatic budgets", error);
        toast({
          variant: "error",
          title: "Erro na Geração Automática",
          description:
            "Não foi possível gerar as sugestões. Verifique suas configurações de IA.",
        });
      }
    });
  };

  const theme = useTheme();

  return (
    <>
      <AutomaticBudgetDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        suggestedBudgets={suggestedBudgets}
      />
      <Card
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderColor: alpha(theme.palette.primary.main, 0.2),
          borderWidth: 1,
          borderStyle: "solid",
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Sparkles
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  color: theme.palette.primary.main,
                }}
              />
              <Typography variant="h6" color="primary.main">
                Orçamentos Automáticos
              </Typography>
            </Stack>
          }
          subheader={
            <Typography
              variant="body2"
              sx={{ color: alpha(theme.palette.primary.main, 0.8), mt: 0.5 }}
            >
              Deixe a IA analisar seus gastos do mês passado e criar um plano de
              orçamento para você em segundos.
            </Typography>
          }
        />
        <CardContent>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isGenerating}
            startIcon={
              isGenerating ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {isGenerating ? "Gerando..." : "Gerar Orçamentos com IA"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
