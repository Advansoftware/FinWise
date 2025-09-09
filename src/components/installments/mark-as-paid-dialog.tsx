// src/components/installments/mark-as-paid-dialog.tsx

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Installment, InstallmentPayment } from '@/core/ports/installments.port';
import { useInstallments } from '@/hooks/use-installments';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const markAsPaidSchema = z.object({
  paidDate: z.string().min(1, 'Data do pagamento é obrigatória'),
});

type MarkAsPaidForm = z.infer<typeof markAsPaidSchema>;

interface MarkAsPaidDialogProps {
  installment: Installment;
  payment: InstallmentPayment | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarkAsPaidDialog({ 
  installment, 
  payment, 
  open, 
  onOpenChange 
}: MarkAsPaidDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshData } = useInstallments();

  const form = useForm<MarkAsPaidForm>({
    resolver: zodResolver(markAsPaidSchema),
    defaultValues: {
      paidDate: new Date().toISOString().split('T')[0], // Data atual como padrão
    },
  });

  const onSubmit = async (data: MarkAsPaidForm) => {
    if (!payment) return;
    
    setIsSubmitting(true);
    try {
      // Marcar como pago sem processar transação financeira
      const response = await fetch('/api/installments/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installmentId: installment.id,
          installmentNumber: payment.installmentNumber,
          paidAmount: payment.scheduledAmount,
          paidDate: new Date(data.paidDate).toISOString(),
          markOnly: true, // Flag para indicar que é apenas marcação, sem transação
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        form.reset();
        await refreshData(); // Atualizar dados
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao marcar como pago');
      }
    } catch (error: any) {
      console.error('Erro ao marcar como pago:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Marcar como Pago
          </DialogTitle>
          <DialogDescription>
            Marque a parcela {payment.installmentNumber} de {installment.name} como paga sem processar transação financeira
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Info */}
          <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Parcela</span>
              <span className="font-medium">{payment.installmentNumber}/{installment.totalInstallments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vencimento Original</span>
              <span className="font-medium">
                {format(parseISO(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="font-medium">{formatCurrency(payment.scheduledAmount)}</span>
            </div>
          </div>

          {/* Alert about functionality */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-400">Apenas marcação</p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  Esta ação apenas registra que o pagamento foi feito, sem debitar de nenhuma carteira.
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="paidDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        max={new Date().toISOString().split('T')[0]} // Não permitir datas futuras
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Marcar como Pago
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
