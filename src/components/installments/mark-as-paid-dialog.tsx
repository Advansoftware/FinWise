// src/components/installments/mark-as-paid-dialog.tsx

import {useState} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField, Box, Stack, Typography, IconButton, useTheme, alpha, CircularProgress} from '@mui/material';
import {Loader2, CheckCircle2, X} from 'lucide-react';
import {Installment, InstallmentPayment} from '@/core/ports/installments.port';
import {useInstallments} from '@/hooks/use-installments';
import {formatCurrency} from '@/lib/utils';
import {format, parseISO} from 'date-fns';
import {ptBR} from 'date-fns/locale';

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
  const theme = useTheme();

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
    <Dialog 
      open={open} 
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
            <span>Marcar como Pago</span>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 'normal' }}>
            Marque a parcela {payment.installmentNumber} de {installment.name} como paga sem processar transação financeira
          </Typography>
        </Box>
        <IconButton onClick={() => onOpenChange(false)} size="small">
          <X style={{ width: '1.25rem', height: '1.25rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Payment Info */}
          <Box sx={{ 
            borderRadius: 1, 
            border: 1, 
            borderColor: 'divider', 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1, 
            bgcolor: alpha(theme.palette.action.hover, 0.5) 
          }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Parcela</Typography>
              <Typography variant="body2" fontWeight="medium">{payment.installmentNumber}/{installment.totalInstallments}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Vencimento Original</Typography>
              <Typography variant="body2" fontWeight="medium">
                {format(parseISO(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Valor</Typography>
              <Typography variant="body2" fontWeight="medium">{formatCurrency(payment.scheduledAmount)}</Typography>
            </Stack>
          </Box>

          {/* Alert about functionality */}
          <Box sx={{ 
            borderRadius: 1, 
            bgcolor: alpha(theme.palette.warning.main, 0.1), 
            border: 1, 
            borderColor: alpha(theme.palette.warning.main, 0.3), 
            p: 1.5 
          }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <CheckCircle2 style={{ width: '1rem', height: '1rem', color: theme.palette.warning.main, marginTop: '0.125rem', flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" fontWeight="medium" color="warning.main">Apenas marcação</Typography>
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                  Esta ação apenas registra que o pagamento foi feito, sem debitar de nenhuma carteira.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <form onSubmit={form.handleSubmit(onSubmit)} id="mark-as-paid-form">
            <Controller
              name="paidDate"
              control={form.control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  type="date"
                  label="Data do Pagamento"
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    if (date) {
                      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                    }
                    field.onChange(date);
                  }}
                  InputLabelProps={{ shrink: true }}
                  error={!!error}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />
          </form>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          form="mark-as-paid-form"
          disabled={isSubmitting} 
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle2 />}
        >
          Marcar como Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
}
