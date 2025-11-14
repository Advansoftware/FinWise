// src/components/goals/create-goal-dialog.tsx
'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { useGoals } from "@/hooks/use-goals";
import { Goal } from "@/lib/types";
import { Calendar, Loader2 } from "lucide-react";
import { SingleDatePicker } from "../single-date-picker";
import { Box, Typography } from '@mui/material';

const goalSchema = z.object({
  name: z.string().min(1, "O nome da meta é obrigatório."),
  targetAmount: z.coerce.number().positive("O valor alvo deve ser maior que zero."),
  monthlyDeposit: z.coerce.number().optional(),
  targetDate: z.date().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface CreateGoalDialogProps {
  children: React.ReactNode;
  initialData?: Goal;
}

export function CreateGoalDialog({ children, initialData }: CreateGoalDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addGoal, updateGoal } = useGoals();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      monthlyDeposit: undefined,
      targetDate: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            form.reset({
                name: initialData.name,
                targetAmount: initialData.targetAmount,
                monthlyDeposit: initialData.monthlyDeposit || undefined,
                targetDate: initialData.targetDate ? new Date(initialData.targetDate) : undefined
            });
        } else {
            form.reset({ name: "", targetAmount: 0, monthlyDeposit: undefined, targetDate: undefined });
        }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (data: GoalFormValues) => {
    setIsSubmitting(true);
    try {
      const goalData: Partial<Goal> = {
        name: data.name,
        targetAmount: Number(data.targetAmount),
        monthlyDeposit: data.monthlyDeposit ? Number(data.monthlyDeposit) : undefined,
        targetDate: data.targetDate ? data.targetDate.toISOString() : undefined,
      };

      if (initialData) {
        await updateGoal(initialData.id, goalData);
      } else {
        await addGoal(goalData as Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save goal:", error);
      toast({ variant: "destructive", title: "Erro ao salvar meta." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Meta" : "Criar Nova Meta"}</DialogTitle>
          <DialogDescription>
            Defina um objetivo financeiro. Preencha os campos opcionais para ajudar a IA a fazer projeções mais precisas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Comprar um Carro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Meta (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 30000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Typography
              sx={{
                fontSize: theme => theme.typography.pxToRem(14),
                fontWeight: theme => theme.typography.fontWeightMedium,
                color: theme => (theme.palette as any).custom?.mutedForeground,
                my: 2,
                textAlign: 'center'
              }}
            >
              Opcional
            </Typography>
             <FormField
              control={form.control}
              name="monthlyDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depósito Mensal Planejado (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Alvo para Conclusão</FormLabel>
                  <FormControl>
                    <SingleDatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Meta"}
              </Button>
            </DialogFooter>
          </Box>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
