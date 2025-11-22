// src/components/installments/pay-installment-dialog.tsx

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import { Loader2, DollarSign, Wallet as WalletIcon, AlertCircle, X } from 'lucide-react';
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
  const theme = useTheme();

  // Encontrar carteira válida: primeira tenta a do parcelamento, depois a primeira disponível
  const getValidWalletId = () => {
    if (installment.sourceWalletId) {
      const walletExists = wallets.find(w => w.id === installment.sourceWalletId);
      if (walletExists) {
        return installment.sourceWalletId;
      }
    }
    // Se a carteira do parcelamento não existe, usar a primeira disponível
    return wallets.length > 0 ? wallets[0].id : '';
  };

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      walletId: getValidWalletId(),
      paidAmount: payment?.scheduledAmount.toString() || '0',
    },
  });

  // Reset form when payment changes or wallets change
  useEffect(() => {
    if (payment) {
      form.setValue('paidAmount', payment.scheduledAmount.toString());
      const validWalletId = getValidWalletId();
      if (validWalletId) {
        form.setValue('walletId', validWalletId);
      }
    }
  }, [payment, installment.sourceWalletId, wallets, form]);

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
    <Dialog 
      open={open} 
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          Registrar Pagamento
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 'normal' }}>
            Registre o pagamento da parcela {payment.installmentNumber} de {installment.name}
          </Typography>
        </Box>
        <IconButton onClick={() => onOpenChange(false)} size="small">
          <X style={{ width: '1.25rem', height: '1.25rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Payment Info */}
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Parcela</Typography>
                <Typography variant="body2" fontWeight="medium">{payment.installmentNumber}/{installment.totalInstallments}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Vencimento</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {format(parseISO(payment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Valor Previsto</Typography>
                <Typography variant="body2" fontWeight="medium">{formatCurrency(payment.scheduledAmount)}</Typography>
              </Box>
            </Stack>
          </Box>

          <form onSubmit={form.handleSubmit(onSubmit)} id="pay-installment-form">
            <Stack spacing={3}>
              <Controller
                name="walletId"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Carteira para Débito</InputLabel>
                    <Select
                      {...field}
                      label="Carteira para Débito"
                      value={field.value || ''}
                    >
                      {wallets.map((wallet) => (
                        <MenuItem key={wallet.id} value={wallet.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WalletIcon style={{ width: '1rem', height: '1rem' }} />
                            <Typography variant="body2">{wallet.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({formatCurrency(wallet.balance)})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{error?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              {/* Wallet Balance Warning */}
              {selectedWallet && (
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 1, 
                  bgcolor: alpha(theme.palette.info.main, 0.1), 
                  color: 'info.main', 
                  border: 1, 
                  borderColor: alpha(theme.palette.info.main, 0.2),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <WalletIcon style={{ width: '1rem', height: '1rem' }} />
                  <Typography variant="body2">
                    Saldo disponível: <strong>{formatCurrency(selectedWallet.balance)}</strong>
                  </Typography>
                </Box>
              )}

              <Controller
                name="paidAmount"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Valor Pago"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              {/* Insufficient Balance Warning */}
              {hasInsufficientBalance && (
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 1, 
                  bgcolor: alpha(theme.palette.error.main, 0.1), 
                  color: 'error.main', 
                  border: 1, 
                  borderColor: alpha(theme.palette.error.main, 0.2),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <AlertCircle style={{ width: '1rem', height: '1rem' }} />
                  <Typography variant="body2">Saldo insuficiente na carteira selecionada</Typography>
                </Box>
              )}

              {/* Difference indicator */}
              {difference !== 0 && !hasInsufficientBalance && (
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 1, 
                  bgcolor: difference > 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                  color: difference > 0 ? 'success.main' : 'warning.main',
                  border: 1,
                  borderColor: difference > 0 ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.warning.main, 0.2)
                }}>
                  <Typography variant="body2">
                    {difference > 0 ? (
                      <>Você está pagando <strong>{formatCurrency(difference)} a mais</strong> que o previsto.</>
                    ) : (
                      <>Você está pagando <strong>{formatCurrency(Math.abs(difference))} a menos</strong> que o previsto.</>
                    )}
                  </Typography>
                </Box>
              )}
            </Stack>
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
          form="pay-installment-form"
          disabled={isSubmitting || hasInsufficientBalance} 
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <DollarSign />}
        >
          Registrar Pagamento
        </Button>
      </DialogActions>
    </Dialog>
  );
}
