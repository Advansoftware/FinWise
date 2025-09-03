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
import { suggestBudgetAmountAction } from "@/app/actions";
import { useAuth } from "@/hooks/use-auth";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

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
            amount: Number(data.amount),
        });
      } else {
        await addBudget({
            ...data,
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                   <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={handleSuggestion} disabled={isSuggesting || !selectedCategory}>
                          {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4 text-primary" />}
                      </Button>
                   </div>
                   {suggestionJustification && (
                      <FormDescription className="text-primary/90 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3"/>{suggestionJustification}
                      </FormDescription>
                   )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
