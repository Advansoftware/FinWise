// src/components/installments/pay-installment-dialog.tsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Wallet as WalletIcon, AlertCircle } from 'lucide-react';
import { Installment, InstallmentPayment } from '@/core/ports/installments.port';
import { useInstallments } from '@/hooks/use-installments';
import { useWallets } from '@/hooks/use-wallets';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const paymentSchema = z.object({
  walletId: z.string().min(1, 'Selecione uma carteira'),
  paidAmount: z.string().min(1, 'Valor é obrigatório').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Valor deve ser maior que zero'
  ),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface PayInstallmentDialogProps {
  installment: Installment;
  payment: InstallmentPayment | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayInstallmentDialog({ 
  installment, 
  payment, 
  open, 
  onOpenChange 
}: PayInstallmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { payInstallment } = useInstallments();
  const { wallets } = useWallets();

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      walletId: installment.sourceWalletId || '',
      paidAmount: payment?.scheduledAmount.toString() || '0',
    },
  });

  // Reset form when payment changes
  useEffect(() => {
    if (payment) {
      form.setValue('paidAmount', payment.scheduledAmount.toString());
      if (installment.sourceWalletId) {
        form.setValue('walletId', installment.sourceWalletId);
      }
    }
  }, [payment, installment.sourceWalletId, form]);

  const selectedWalletId = form.watch('walletId');
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const paidAmount = Number(form.watch('paidAmount') || 0);
  const difference = paidAmount - (payment?.scheduledAmount || 0);
  const hasInsufficientBalance = selectedWallet && paidAmount > selectedWallet.balance;

  const onSubmit = async (data: PaymentForm) => {
    if (!payment) return;
    
    if (hasInsufficientBalance) {
      return; // Não permitir se não tiver saldo suficiente
    }
    
    setIsSubmitting(true);
    try {
      // Criar transação através da API que já implementa tudo
      const response = await fetch('/api/installments/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installmentId: installment.id,
          installmentNumber: payment.installmentNumber,
          paidAmount: Number(data.paidAmount),
          paidDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        form.reset();
        // O refresh será feito pelo hook useInstallments
        window.location.reload(); // Força reload para atualizar todas as informações
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao processar pagamento');
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      // Exibir erro seria bom ter um toast aqui
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Registre o pagamento da parcela {payment.installmentNumber} de {installment.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Parcela</span>
              <span className="font-medium">{payment.installmentNumber}/{installment.totalInstallments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vencimento</span>
              <span className="font-medium">
                {format(parseISO(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Previsto</span>
              <span className="font-medium">{formatCurrency(payment.scheduledAmount)}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carteira para Débito</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma carteira" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <div className="flex items-center gap-2">
                              <WalletIcon className="h-4 w-4" />
                              <span>{wallet.name}</span>
                              <span className="text-muted-foreground">
                                ({formatCurrency(wallet.balance)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Wallet Balance Warning */}
              {selectedWallet && (
                <div className="text-sm p-2 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4" />
                    <span>Saldo disponível: <strong>{formatCurrency(selectedWallet.balance)}</strong></span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Pago (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Insufficient Balance Warning */}
              {hasInsufficientBalance && (
                <div className="text-sm p-2 rounded-md bg-destructive/10 dark:bg-destructive/10 text-destructive dark:text-destructive border border-destructive/20 dark:border-destructive/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Saldo insuficiente na carteira selecionada</span>
                  </div>
                </div>
              )}

              {/* Difference indicator */}
              {difference !== 0 && !hasInsufficientBalance && (
                <div className={`text-sm p-2 rounded-md ${
                  difference > 0 
                    ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50' 
                    : 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50'
                }`}>
                  {difference > 0 ? (
                    <>Você está pagando <strong>{formatCurrency(difference)} a mais</strong> que o previsto.</>
                  ) : (
                    <>Você está pagando <strong>{formatCurrency(Math.abs(difference))} a menos</strong> que o previsto.</>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || hasInsufficientBalance}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Registrar Pagamento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
