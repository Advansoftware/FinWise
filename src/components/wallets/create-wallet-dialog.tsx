// src/components/wallets/create-wallet-dialog.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useWallets } from "@/hooks/use-wallets";
import { Wallet, WalletType } from "@/lib/types";
import { Loader2 } from "lucide-react";

const walletSchema = z.object({
  name: z.string().min(1, "O nome da carteira é obrigatório."),
  type: z.enum(['Conta Corrente', 'Cartão de Crédito', 'Poupança', 'Investimentos', 'Dinheiro', 'Outros'], {
      required_error: "O tipo de carteira é obrigatório"
  }),
});

type WalletFormValues = z.infer<typeof walletSchema>;

const walletTypes: WalletType[] = ['Conta Corrente', 'Cartão de Crédito', 'Poupança', 'Investimentos', 'Dinheiro', 'Outros'];

interface CreateWalletDialogProps {
  children: React.ReactNode;
  initialData?: Wallet;
}

export function CreateWalletDialog({ children, initialData }: CreateWalletDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addWallet, updateWallet } = useWallets();

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      type: "Conta Corrente",
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            form.reset({
                name: initialData.name,
                type: initialData.type,
            });
        } else {
            form.reset({ name: "", type: "Conta Corrente" });
        }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (data: WalletFormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateWallet(initialData.id, data);
      } else {
        await addWallet(data);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save wallet:", error);
      toast({ variant: "destructive", title: "Erro ao salvar carteira." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Carteira" : "Criar Nova Carteira"}</DialogTitle>
          <DialogDescription>
            Adicione uma nova conta, cartão ou outra fonte de recursos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Carteira</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Conta Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Carteira</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {walletTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                {initialData ? "Salvar Alterações" : "Criar Carteira"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
