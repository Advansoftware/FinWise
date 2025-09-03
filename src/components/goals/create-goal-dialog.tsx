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
import { Loader2 } from "lucide-react";

const goalSchema = z.object({
  name: z.string().min(1, "O nome da meta é obrigatório."),
  targetAmount: z.coerce.number().positive("O valor alvo deve ser maior que zero."),
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
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            form.reset({
                name: initialData.name,
                targetAmount: initialData.targetAmount,
            });
        } else {
            form.reset({ name: "", targetAmount: 0 });
        }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (data: GoalFormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateGoal(initialData.id, {
            ...data,
            targetAmount: Number(data.targetAmount),
        });
      } else {
        await addGoal({
            ...data,
            targetAmount: Number(data.targetAmount),
        });
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
            Defina um objetivo financeiro e acompanhe seu progresso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Meta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
