// src/components/billing/subscription-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  RefreshCw,
  XCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { usePayment } from '@/hooks/use-payment';
import { usePlan } from '@/hooks/use-plan';
import { formatCurrency } from '@/lib/utils';

export function SubscriptionManager() {
  const {
    subscription,
    isLoadingSubscription,
    isProcessing,
    fetchSubscription,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
  } = usePayment();
  const { plan } = usePlan();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPaidPlan = plan && plan !== 'Básico';

  if (!isPaidPlan) {
    return null;
  }

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelSubscription(false); // Cancel at period end
      setCancelDialogOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateSubscription();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const getStatusChip = () => {
    if (!subscription) return null;

    if (subscription.cancelAtPeriodEnd) {
      return (
        <Chip
          icon={<AlertTriangle size={14} />}
          label="Cancelamento agendado"
          color="warning"
          size="small"
        />
      );
    }

    switch (subscription.status) {
      case 'active':
        return (
          <Chip
            icon={<CheckCircle size={14} />}
            label="Ativa"
            color="success"
            size="small"
          />
        );
      case 'past_due':
        return (
          <Chip
            icon={<AlertTriangle size={14} />}
            label="Pagamento pendente"
            color="error"
            size="small"
          />
        );
      case 'canceled':
        return (
          <Chip
            icon={<XCircle size={14} />}
            label="Cancelada"
            color="default"
            size="small"
          />
        );
      default:
        return (
          <Chip
            label={subscription.status}
            size="small"
          />
        );
    }
  };

  const formatPaymentMethod = () => {
    if (!subscription?.paymentMethod) return 'Não configurado';

    const { brand, last4, expMonth, expYear } = subscription.paymentMethod;
    if (!brand || !last4) return 'Cartão configurado';
    
    const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
    
    return `${brandName} •••• ${last4} (${expMonth}/${expYear})`;
  };

  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader
          title={<Skeleton width={200} />}
        />
        <CardContent>
          <Stack spacing={2}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader
          title={
            <Typography variant="h6">
              Detalhes da Assinatura
            </Typography>
          }
        />
        <CardContent>
          <Alert severity="info">
            <AlertTitle>Informações não disponíveis</AlertTitle>
            Não foi possível carregar os detalhes da sua assinatura.
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink size={16} />}
                onClick={() => openCustomerPortal()}
                disabled={isProcessing}
              >
                Gerenciar no Portal Stripe
              </Button>
            </Box>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                Detalhes da Assinatura
              </Typography>
              {getStatusChip()}
            </Stack>
          }
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Alerta de cancelamento agendado */}
            {subscription.cancelAtPeriodEnd && (
              <Alert 
                severity="warning"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleReactivate}
                    disabled={isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
                  >
                    Reativar
                  </Button>
                }
              >
                <AlertTitle>Cancelamento agendado</AlertTitle>
                Sua assinatura será cancelada em{' '}
                <strong>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                </strong>
                . Você pode continuar usando todos os recursos até essa data.
              </Alert>
            )}

            {/* Detalhes do plano */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Plano Atual
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h5" fontWeight="bold">
                  {subscription.plan}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {formatCurrency(subscription.priceAmount / 100)}/{subscription.interval === 'month' ? 'mês' : 'ano'}
                </Typography>
              </Stack>
            </Box>

            <Divider />

            {/* Informações de cobrança */}
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Calendar size={20} color="gray" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Período atual
                  </Typography>
                  <Typography variant="body1">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <CreditCard size={20} color="gray" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Método de pagamento
                  </Typography>
                  <Typography variant="body1">
                    {formatPaymentMethod()}
                  </Typography>
                </Box>
              </Stack>

              {subscription.nextInvoiceDate && !subscription.cancelAtPeriodEnd && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Calendar size={20} color="gray" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Próxima cobrança
                    </Typography>
                    <Typography variant="body1">
                      {new Date(subscription.nextInvoiceDate).toLocaleDateString('pt-BR')} -{' '}
                      {formatCurrency(subscription.priceAmount / 100)}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>

            <Divider />

            {/* Ações */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExternalLink size={16} />}
                onClick={() => openCustomerPortal()}
                disabled={isProcessing}
              >
                Atualizar Pagamento
              </Button>

              {!subscription.cancelAtPeriodEnd && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<XCircle size={16} />}
                  onClick={handleCancelClick}
                  disabled={isProcessing}
                >
                  Cancelar Assinatura
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de cancelamento */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AlertTriangle size={24} color="#ed6c02" />
            <span>Cancelar assinatura?</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Stack spacing={2}>
              <Typography>
                Tem certeza que deseja cancelar sua assinatura do plano <strong>{subscription?.plan}</strong>?
              </Typography>
              
              <Alert severity="info">
                <Typography variant="body2">
                  Sua assinatura permanecerá ativa até{' '}
                  <strong>
                    {subscription?.currentPeriodEnd 
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
                      : 'o fim do período atual'}
                  </strong>.
                  Após essa data, você voltará para o plano Básico.
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary">
                Você pode reativar sua assinatura a qualquer momento antes da data de cancelamento.
              </Typography>
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)} 
            disabled={isProcessing}
          >
            Manter assinatura
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={16} /> : null}
          >
            {isProcessing ? 'Cancelando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
