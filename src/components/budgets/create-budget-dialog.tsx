// src/components/budgets/create-budget-dialog.tsx
'use client';

import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { Budget, TransactionCategory } from "@/lib/types";
import { Loader2, Sparkles } from "lucide-react";
import { suggestBudgetAmountAction } from "@/services/ai-actions";
import { useAuth } from "@/hooks/use-auth";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeButton } from "../pro-upgrade-button";
import { Box, Stack } from '@mui/material';

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
          variant: "destructive",
          title: "Sem dados para sugestão",
          description: `Não há gastos na categoria "${selectedCategory}" no mês passado para analisar.`,
        });
        return;
      }

      try {
        const result = await suggestBudgetAmountAction({
          category: selectedCategory,
          transactions: JSON.stringify(transactionsFromLastMonth, null, 2),
        }, user.uid);
        
        form.setValue("amount", result.suggestedAmount);
        setSuggestionJustification(result.justification);

      } catch (error) {
        console.error("Error suggesting budget:", error);
        toast({
          variant: "destructive",
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
      toast({ variant: "destructive", title: "Erro ao salvar orçamento." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Orçamento" : "Criar Novo Orçamento"}</DialogTitle>
          <DialogDescription>
            Defina um limite de gastos para uma categoria específica neste mês.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Orçamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gastos com Comida" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Orçado (R$)</FormLabel>
                   <Stack direction="row" alignItems="center" spacing={2}>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} />
                      </FormControl>
                       <ProUpgradeButton requiredPlan="Plus" tooltipContent="Desbloqueie sugestões de orçamento com IA com o plano Plus.">
                          <Button type="button" variant="outline" size="icon" onClick={handleSuggestion} disabled={isSuggesting || !selectedCategory || !isPlus}>
                              {isSuggesting ? <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin"/> : <Sparkles style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />}
                          </Button>
                      </ProUpgradeButton>
                   </Stack>
                   {suggestionJustification && isPlus && (
                      <FormDescription>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ color: 'rgba(var(--primary-rgb), 0.9)' }}>
                          <Sparkles style={{ width: '0.75rem', height: '0.75rem' }}/>{suggestionJustification}
                        </Stack>
                      </FormDescription>
                   )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} className="animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
