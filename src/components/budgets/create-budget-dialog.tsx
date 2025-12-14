// src/components/budgets/create-budget-dialog.tsx
'use client';

import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, CircularProgress, Box, Stack, Typography, useTheme, alpha, InputAdornment, IconButton, Tooltip} from '@mui/material';
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { Budget, TransactionCategory } from "@/lib/types";
import { Sparkles } from "lucide-react";
import { suggestBudget } from "@/services/ai-service-router";
import { useAuth } from "@/hooks/use-auth";
import { useWebLLM } from "@/hooks/use-webllm";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeButton } from "../pro-upgrade-button";

const budgetSchema = z.object({
  name: z.string().min(1, "O nome do orçamento é obrigatório."),
  category: z.string().min(1, "A categoria é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface CreateBudgetDialogProps {
  children: React.ReactNode;
  initialData?: Budget;
}

export function CreateBudgetDialog({ children, initialData }: CreateBudgetDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories, allTransactions } = useTransactions();
  const { addBudget, updateBudget } = useBudgets();
  const [isSuggesting, startSuggesting] = useTransition();
  const [suggestionJustification, setSuggestionJustification] = useState<string | null>(null);
  const { isPlus } = usePlan();

  const expenseCategories = categories.filter(c => c !== "Salário" && c !== "Vendas" && c !== "Investimentos");
  const { isWebLLMActive } = useWebLLM();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      category: "",
      amount: 0,
    },
  });

  const selectedCategory = form.watch("category");

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            form.reset({
                name: initialData.name,
                category: initialData.category,
                amount: initialData.amount,
            });
        } else {
            form.reset({ name: "", category: "", amount: 0 });
        }
        setSuggestionJustification(null);
    }
  }, [isOpen, initialData, form]);

  const handleSuggestion = () => {
    if (!user || !selectedCategory) return;
    if (!isPlus) return; // Plan check

    setSuggestionJustification(null);
    startSuggesting(async () => {
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = endOfMonth(lastMonthStart);

      const transactionsFromLastMonth = allTransactions.filter(t =>
        t.category === selectedCategory &&
        t.type === 'expense' &&
        new Date(t.date) >= lastMonthStart &&
        new Date(t.date) <= lastMonthEnd
      );

      if (transactionsFromLastMonth.length === 0) {
        toast({
          variant: "error",
          title: "Sem dados para sugestão",
          description: `Não há gastos na categoria "${selectedCategory}" no mês passado para analisar.`,
        });
        return;
      }

      try {
        const result = await suggestBudget({
          category: selectedCategory,
          transactions: JSON.stringify(transactionsFromLastMonth, null, 2),
        }, user.uid);
        
        form.setValue("amount", result.suggestedAmount);
        setSuggestionJustification(result.justification);

      } catch (error) {
        console.error("Error suggesting budget:", error);
        toast({
          variant: "error",
          title: "Erro na Sugestão",
          description: "Não foi possível obter a sugestão da IA. Verifique suas configurações.",
        });
      }
    });
  }

  const onSubmit = async (data: BudgetFormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateBudget(initialData.id, {
            ...data,
            category: data.category as TransactionCategory,
            amount: Number(data.amount),
        });
      } else {
        await addBudget({
            ...data,
            category: data.category as TransactionCategory,
            amount: Number(data.amount),
            period: 'monthly'
        });
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save budget:", error);
      toast({ variant: "error", title: "Erro ao salvar orçamento." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = useTheme();

  return (
    <>
      <Box onClick={() => setIsOpen(true)} sx={{ display: 'inline-block' }}>
        {children}
      </Box>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {initialData ? "Editar Orçamento" : "Criar Novo Orçamento"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Defina um limite de gastos para uma categoria específica neste mês.
          </Typography>
          
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Nome do Orçamento"
                    placeholder="Ex: Gastos com Comida"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      {...field}
                      label="Categoria"
                    >
                      {expenseCategories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                    {error && <FormHelperText>{error.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                     <Stack direction="row" spacing={1} alignItems="flex-start">
                        <TextField
                            {...field}
                            label="Valor Orçado (R$)"
                            type="number"
                            placeholder="Ex: 500.00"
                            fullWidth
                            InputProps={{
                                inputProps: { step: 0.01 }
                            }}
                            error={!!error}
                            helperText={error?.message}
                        />
                         <ProUpgradeButton requiredPlan="Plus" tooltipContent="Desbloqueie sugestões de orçamento com IA com o plano Plus.">
                            <Tooltip title="Sugestão de IA">
                                <span>
                                    <Button 
                                        variant="outlined" 
                                        sx={{ height: 56, minWidth: 56, p: 0 }}
                                        onClick={handleSuggestion} 
                                        disabled={isSuggesting || !selectedCategory || !isPlus}
                                    >
                                        {isSuggesting ? <CircularProgress size={20} /> : <Sparkles size={20} style={{ color: theme.palette.primary.main }} />}
                                    </Button>
                                </span>
                            </Tooltip>
                        </ProUpgradeButton>
                     </Stack>
                     {suggestionJustification && isPlus && (
                        <FormHelperText sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', mt: 1 }}>
                           <Sparkles size={12} /> {suggestionJustification}
                        </FormHelperText>
                     )}
                  </FormControl>
                )}
              />
            </Stack>
            
            <DialogActions sx={{ p: 0, mt: 3 }}>
              <Button onClick={() => setIsOpen(false)} disabled={isSubmitting} variant="outlined">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {initialData ? "Salvar Alterações" : "Criar Orçamento"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
