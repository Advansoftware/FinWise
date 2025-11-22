'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Chip, 
  Button, 
  LinearProgress, 
  Box, 
  Stack, 
  useTheme, 
  alpha 
} from '@mui/material';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp,
  Trophy,
  Flame,
  Star,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useInstallments } from "@/hooks/use-installments";
import { usePlan } from "@/hooks/use-plan";

export function InstallmentsSummaryCard() {
  const { plan } = usePlan();
  const { summary, isLoading } = useInstallments();
  const [showDetails, setShowDetails] = useState(false);
  const theme = useTheme();

  // Verificar se o usuário tem acesso (plano Pro ou superior)
  const hasAccess = plan && ['Pro', 'Plus', 'Infinity'].includes(plan);

  if (!hasAccess) {
    return (
      <Card sx={{ overflow: 'hidden', borderStyle: 'dashed' }}>
        <CardHeader sx={{ pb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
              <Typography variant="h6" component="span">
                Parcelamentos
              </Typography>
            </Box>
            <Chip label="Pro+" variant="outlined" size="small" />
          </Stack>
        </CardHeader>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Gerencie suas compras parceladas com gamificação e controle total.
          </Typography>
          <Link href="/billing" passHref style={{ width: '100%' }}>
            <Button size="small" variant="contained" fullWidth endIcon={<ChevronRight size={16} />}>
              Fazer Upgrade
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader sx={{ pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            <Typography variant="h6" component="span">
              Parcelamentos
            </Typography>
          </Box>
        </CardHeader>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ height: '1rem', bgcolor: 'action.hover', borderRadius: 1, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <Box sx={{ height: '1rem', bgcolor: 'action.hover', borderRadius: 1, width: '75%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <Box sx={{ height: '1rem', bgcolor: 'action.hover', borderRadius: 1, width: '50%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalActiveInstallments === 0) {
    return (
      <Card>
        <CardHeader sx={{ pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            <Typography variant="h6" component="span">
              Parcelamentos
            </Typography>
          </Box>
        </CardHeader>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Nenhum parcelamento ativo no momento.
          </Typography>
          <Link href="/installments" passHref style={{ width: '100%' }}>
            <Button size="small" variant="contained" fullWidth endIcon={<ChevronRight size={16} />}>
              Criar Parcelamento
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { gamification } = summary;
  const nextPayments = summary.upcomingPayments.slice(0, 2);
  const overdueCount = summary.overduePayments.length;

  return (
    <Card sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader sx={{ pb: 3, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            <Typography variant="h6" component="span">
              Parcelamentos
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            {gamification.streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f97316' }}
              >
                <Flame style={{ width: '1rem', height: '1rem' }} />
                <Typography variant="caption" fontWeight="medium" component="span">
                  {gamification.streak}
                </Typography>
              </motion.div>
            )}
            <Chip 
              icon={<Trophy size={12} />} 
              label={`Nível ${gamification.level.level}`} 
              color="secondary" 
              size="small" 
            />
          </Stack>
        </Stack>
      </CardHeader>
      
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {/* Status Geral */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="semibold">
              {summary.totalActiveInstallments}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ativos
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight="semibold">
              {formatCurrency(summary.totalMonthlyCommitment)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Mensal
            </Typography>
          </Box>
        </Box>

        {/* Progresso do Nível */}
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              Progresso do Nível
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {gamification.points}/{gamification.level.pointsRequired + gamification.level.pointsToNext} pts
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate"
            value={(gamification.points / (gamification.level.pointsRequired + gamification.level.pointsToNext)) * 100} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Stack>

        {/* Alertas importantes */}
        {overdueCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2, 
              p: 3, 
              bgcolor: alpha(theme.palette.error.main, 0.1), 
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, 
              borderRadius: 1 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AlertTriangle style={{ width: '1rem', height: '1rem', color: theme.palette.error.main }} />
                <Typography variant="body2" fontWeight="semibold" color="error.main">
                  {overdueCount} parcela{overdueCount > 1 ? 's' : ''} em atraso
                </Typography>
              </Box>
              
              {/* Mostrar as parcelas em atraso mais urgentes */}
              {summary.overduePayments.slice(0, 1).map((payment) => {
                const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <Stack key={payment.id} direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="error.main" noWrap>
                      Parcela {payment.installmentNumber} • {daysOverdue} dias
                    </Typography>
                    <Typography variant="caption" fontWeight="medium" color="error.main" sx={{ flexShrink: 0, ml: 2 }}>
                      {formatCurrency(payment.scheduledAmount)}
                    </Typography>
                  </Stack>
                );
              })}
              
              {summary.overduePayments.length > 1 && (
                <Typography variant="caption" color="error.main" sx={{ pt: 1, borderTop: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                  E mais {summary.overduePayments.length - 1} parcela{summary.overduePayments.length - 1 > 1 ? 's' : ''} em atraso
                </Typography>
              )}
            </Box>
          </motion.div>
        )}

        {/* Próximos Pagamentos - mais compacto */}
        {nextPayments.length > 0 && !overdueCount && (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
              <Typography variant="caption">
                Próximos pagamentos
              </Typography>
            </Box>
            {nextPayments.slice(0, 2).map((payment) => (
              <Stack key={payment.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" fontWeight="medium" noWrap display="block">
                    Parcela {payment.installmentNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(payment.dueDate).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight="medium" sx={{ flexShrink: 0, ml: 2 }}>
                  {formatCurrency(payment.scheduledAmount)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {/* Badges recentes - mais compacto */}
        {gamification.badges.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {gamification.badges.slice(0, 3).map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                title={badge.name}
              >
                <Box sx={{ 
                  width: '1.5rem', 
                  height: '1.5rem', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(to bottom right, #facc15, #ca8a04)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0 
                }}>
                  <Star style={{ width: '0.75rem', height: '0.75rem', color: 'white' }} />
                </Box>
              </motion.div>
            ))}
            {gamification.badges.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{gamification.badges.length - 3}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {/* Botão de ação */}
      <CardContent sx={{ pt: 0, pb: 4, flexShrink: 0 }}>
        <Link href="/installments" passHref style={{ width: '100%' }}>
          <Button size="small" variant="outlined" fullWidth endIcon={<ChevronRight size={16} />}>
            Ver Detalhes
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
