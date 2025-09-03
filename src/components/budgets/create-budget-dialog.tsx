// src/components/budgets/create-budget-dialog.tsx
'use client';

import { useEffect, useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { Budget, TransactionCategory } from "@/lib/types";
import { Loader2 } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories } = useTransactions();
  const { addBudget, updateBudget } = useBudgets();

  const expenseCategories = categories.filter(c => c !== "Salário" && c !== "Vendas" && c !== "Investimentos");

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      category: "",
      amount: 0,
    },
  });

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
    }
  }, [isOpen, initialData, form]);

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
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} />
                  </FormControl>
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
