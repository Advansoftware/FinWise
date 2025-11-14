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
import { SingleDatePicker } from '@/components/single-date-picker';
import { Box, Stack, Typography } from '@mui/material';

const markAsPaidSchema = z.object({
  paidDate: z.date({
    required_error: 'Data do pagamento é obrigatória',
  }),
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
      paidDate: new Date(), // Data atual como padrão
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
          paidDate: data.paidDate.toISOString(),
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
      <DialogContent sx={{ maxWidth: { sm: '28rem' } }}>
        <DialogHeader>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
              <span>Marcar como Pago</span>
            </Stack>
          </DialogTitle>
          <DialogDescription>
            Marque a parcela {payment.installmentNumber} de {installment.name} como paga sem processar transação financeira
          </DialogDescription>
        </DialogHeader>

        <Stack spacing={2}>
          {/* Payment Info */}
          <Box sx={{ borderRadius: '0.5rem', border: '1px solid var(--border)', p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'rgba(var(--muted-rgb), 0.5)' }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Parcela</Typography>
              <Typography sx={{ fontWeight: 500 }}>{payment.installmentNumber}/{installment.totalInstallments}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Vencimento Original</Typography>
              <Typography sx={{ fontWeight: 500 }}>
                {format(parseISO(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Valor</Typography>
              <Typography sx={{ fontWeight: 500 }}>{formatCurrency(payment.scheduledAmount)}</Typography>
            </Stack>
          </Box>

          {/* Alert about functionality */}
          <Box sx={{ borderRadius: '0.5rem', bgcolor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', p: 1.5 }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#d97706', marginTop: '0.125rem', flexShrink: 0 }} />
              <Box sx={{ fontSize: '0.875rem' }}>
                <Typography sx={{ fontWeight: 500, color: '#d97706' }}>Apenas marcação</Typography>
                <Typography sx={{ color: '#d97706', mt: 0.5 }}>
                  Esta ação apenas registra que o pagamento foi feito, sem debitar de nenhuma carteira.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormField
                control={form.control}
                name="paidDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                      <SingleDatePicker
                        date={field.value}
                        setDate={(date) => {
                          if (date && date <= new Date()) {
                            field.onChange(date);
                          }
                        }}
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
                    <Loader2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} className="animate-spin" />
                  ) : (
                    <CheckCircle2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  )}
                  Marcar como Pago
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
