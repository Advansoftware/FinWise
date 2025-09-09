// src/components/goals/add-deposit-dialog.tsx
'use client';

import { useState } from "react";
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
import { useWallets } from "@/hooks/use-wallets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const depositSchema = z.object({
  amount: z.coerce.number().positive("O valor do depósito deve ser maior que zero."),
  walletId: z.string().min(1, "A carteira de origem é obrigatória.")
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface AddDepositDialogProps {
  children: React.ReactNode;
  goal: Goal;
}

export function AddDepositDialog({ children, goal }: AddDepositDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addDeposit } = useGoals();
  const { wallets } = useWallets();

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: 0, walletId: '' },
  });

  const onSubmit = async (data: DepositFormValues) => {
    setIsSubmitting(true);
    try {
      await addDeposit(goal.id, Number(data.amount), data.walletId);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add deposit:", error);
      toast({ variant: "destructive", title: "Erro ao adicionar depósito." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) form.reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Depósito para "{goal.name}"</DialogTitle>
          <DialogDescription>
            Insira o valor que você deseja adicionar a esta meta e de qual carteira o dinheiro sairá.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Depósito (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 100.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carteira de Origem</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione de onde sairá o dinheiro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name} (R$ {(wallet.balance || 0).toFixed(2)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
