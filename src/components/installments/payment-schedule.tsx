// src/components/installments/payment-schedule.tsx

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  useTheme, 
  alpha,
  Stack,
  Chip,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2
} from 'lucide-react';
import { InstallmentPayment } from '@/core/ports/installments.port';
import { useInstallments } from '@/hooks/use-installments';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PaymentSchedule() {
  const [upcomingPayments, setUpcomingPayments] = useState<InstallmentPayment[]>([]);
  const [overduePayments, setOverduePayments] = useState<InstallmentPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const theme = useTheme();
  
  const { getUpcomingPayments, getOverduePayments, installments } = useInstallments();

  useEffect(() => {
    const loadPayments = async () => {
      setIsLoading(true);
      const [upcoming, overdue] = await Promise.all([
        getUpcomingPayments(60), // Próximos 60 dias
        getOverduePayments()
      ]);
      
      setUpcomingPayments(upcoming);
      setOverduePayments(overdue);
      setIsLoading(false);
    };

    loadPayments();
  }, [getUpcomingPayments, getOverduePayments, installments]);

  const getInstallmentName = (payment: InstallmentPayment) => {
    const installment = installments.find(i => i.id === payment.installmentId);
    return installment?.name || 'Parcelamento não encontrado';
  };

  const PaymentCard = ({ payment }: { payment: InstallmentPayment }) => {
    const dueDate = parseISO(payment.dueDate);
    const installmentName = getInstallmentName(payment);
    
    const getStatusInfo = () => {
      if (payment.status === 'paid') {
        return {
          icon: CheckCircle2,
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.05),
          borderColor: alpha(theme.palette.success.main, 0.2),
          label: 'Pago'
        };
      } else if (isPast(dueDate) && !isToday(dueDate)) {
        return {
          icon: AlertTriangle,
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.05),
          borderColor: alpha(theme.palette.error.main, 0.2),
          label: 'Em Atraso'
        };
      } else if (isToday(dueDate)) {
        return {
          icon: Clock,
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.05),
          borderColor: alpha(theme.palette.warning.main, 0.2),
          label: 'Vence Hoje'
        };
      } else {
        return {
          icon: Calendar,
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.05),
          borderColor: alpha(theme.palette.info.main, 0.2),
          label: 'Pendente'
        };
      }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
      <Card sx={{ 
        bgcolor: statusInfo.bgColor, 
        borderColor: statusInfo.borderColor,
        transition: 'all 0.2s',
        '&:hover': { boxShadow: 3 }
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StatusIcon style={{ width: '1rem', height: '1rem', color: statusInfo.color }} />
                <Chip 
                  label={statusInfo.label}
                  size="small"
                  sx={{ 
                    color: statusInfo.color, 
                    borderColor: statusInfo.borderColor,
                    bgcolor: alpha(statusInfo.color, 0.1),
                    fontWeight: 'bold',
                    height: 24
                  }}
                />
              </Box>
              
              <Typography variant="subtitle2" fontWeight="semibold" noWrap sx={{ mb: 0.5 }}>
                {installmentName}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Parcela {payment.installmentNumber}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Vencimento</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Valor</Typography>
                  <Typography variant="subtitle2" fontWeight="semibold">
                    {formatCurrency(payment.paidAmount || payment.scheduledAmount)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 4 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={128} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label={`Próximos Vencimentos (${upcomingPayments.length})`} value="upcoming" />
            <Tab label={`Em Atraso (${overduePayments.length})`} value="overdue" />
          </Tabs>
        </Box>

        {activeTab === 'upcoming' && (
          <Box>
            {upcomingPayments.length === 0 ? (
              <Card>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                  <Calendar style={{ width: '3rem', height: '3rem', color: theme.palette.text.secondary, marginBottom: '1rem' }} />
                  <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1 }}>Nenhum vencimento próximo</Typography>
                  <Typography color="text.secondary" align="center">
                    Você está em dia com seus pagamentos! Não há parcelas para vencer nos próximos 60 dias.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 4 }}>
                {upcomingPayments.map((payment) => (
                  <PaymentCard key={`${payment.installmentId}-${payment.installmentNumber}`} payment={payment} />
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeTab === 'overdue' && (
          <Box>
            {overduePayments.length === 0 ? (
              <Card>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                  <CheckCircle2 style={{ width: '3rem', height: '3rem', color: theme.palette.success.main, marginBottom: '1rem' }} />
                  <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1 }}>Nenhuma parcela em atraso</Typography>
                  <Typography color="text.secondary" align="center">
                    Parabéns! Você está em dia com todos os seus parcelamentos.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={4}>
                <Box sx={{ 
                  bgcolor: alpha(theme.palette.error.main, 0.05), 
                  border: 1, 
                  borderColor: alpha(theme.palette.error.main, 0.2), 
                  borderRadius: 2, 
                  p: 2 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.error.main, marginTop: '0.125rem' }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="semibold" color="error.main">Atenção: Parcelas em Atraso</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Você tem {overduePayments.length} parcela(s) em atraso. 
                        Considere quitar esses pagamentos o quanto antes.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 4 }}>
                  {overduePayments.map((payment) => (
                    <PaymentCard key={`${payment.installmentId}-${payment.installmentNumber}`} payment={payment} />
                  ))}
                </Box>
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </Stack>
  );
}
