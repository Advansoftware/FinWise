// src/components/budgets/spending-analysis.tsx

import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Button, 
  Chip, 
  LinearProgress, 
  Divider, 
  Box, 
  Stack, 
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/lib/types";
import { useTransactions } from "@/hooks/use-transactions";
import { subMonths, format, isAfter, isBefore } from 'date-fns';

interface CategoryAnalysis {
  category: string;
  totalSpent: number;
  transactionCount: number;
  averageMonthly: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  suggestedBudget: number;
  currentBudgetStatus: 'none' | 'under' | 'over' | 'adequate';
}

interface SpendingAnalysisProps {
  onBudgetSuggestionAccepted?: (category: string, amount: number) => void;
}

export function SpendingAnalysis({ onBudgetSuggestionAccepted }: SpendingAnalysisProps) {
  const { allTransactions } = useTransactions();

  const analysisData = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return null;

    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);
    const sixMonthsAgo = subMonths(now, 6);

    // Filtrar transações dos últimos 6 meses (apenas despesas)
    const recentTransactions = allTransactions.filter((t: Transaction) => {
      const transactionDate = new Date(t.date);
      return isAfter(transactionDate, sixMonthsAgo) && 
             isBefore(transactionDate, now) && 
             t.type === 'expense';
    });

    if (recentTransactions.length === 0) return null;

    // Agrupar por categoria
    const categoryGroups = recentTransactions.reduce((acc: Record<string, Transaction[]>, transaction: Transaction) => {
      const category = transaction.category || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    // Analisar cada categoria
    const categoryAnalysis: CategoryAnalysis[] = Object.entries(categoryGroups).map(([category, categoryTransactions]: [string, Transaction[]]) => {
      const totalSpent = categoryTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const transactionCount = categoryTransactions.length;

      // Dividir em dois períodos para análise de tendência
      const recentPeriod = categoryTransactions.filter((t: Transaction) => 
        isAfter(new Date(t.date), threeMonthsAgo)
      );
      const olderPeriod = categoryTransactions.filter((t: Transaction) => 
        isBefore(new Date(t.date), threeMonthsAgo)
      );

      const recentSpending = recentPeriod.reduce((sum: number, t: Transaction) => sum + t.amount, 0) / 3; // média mensal recente
      const olderSpending = olderPeriod.reduce((sum: number, t: Transaction) => sum + t.amount, 0) / 3; // média mensal anterior

      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;

      if (olderSpending > 0) {
        trendPercentage = ((recentSpending - olderSpending) / olderSpending) * 100;
        if (Math.abs(trendPercentage) > 10) {
          trend = trendPercentage > 0 ? 'up' : 'down';
        }
      }

      const averageMonthly = totalSpent / 6; // média dos 6 meses
      
      // Sugerir orçamento com margem de segurança
      // Se tendência é crescente, usar gastos recentes + 15%
      // Se estável/decrescente, usar média + 10%
      let suggestedBudget;
      if (trend === 'up') {
        suggestedBudget = recentSpending * 1.15;
      } else {
        suggestedBudget = averageMonthly * 1.10;
      }

      // Arredondar para valores mais "amigáveis"
      if (suggestedBudget > 1000) {
        suggestedBudget = Math.round(suggestedBudget / 50) * 50;
      } else if (suggestedBudget > 100) {
        suggestedBudget = Math.round(suggestedBudget / 10) * 10;
      } else {
        suggestedBudget = Math.round(suggestedBudget / 5) * 5;
      }

      return {
        category,
        totalSpent,
        transactionCount,
        averageMonthly,
        trend,
        trendPercentage: Math.abs(trendPercentage),
        suggestedBudget,
        currentBudgetStatus: 'none' // TODO: comparar com orçamentos existentes
      };
    });

    // Ordenar por gasto total (maior para menor)
    categoryAnalysis.sort((a, b) => b.totalSpent - a.totalSpent);

    const totalSpent = recentTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const averageMonthlyTotal = totalSpent / 6;

    return {
      categories: categoryAnalysis,
      totalSpent,
      averageMonthlyTotal,
      transactionCount: recentTransactions.length,
      analysisPeriod: '6 meses'
    };
  }, [allTransactions]);

  const theme = useTheme();

  if (!analysisData) {
    return (
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <BarChart3 style={{ width: 48, height: 48, margin: '0 auto 16px', color: theme.palette.text.secondary }} />
          <Typography variant="h6" gutterBottom>Análise Indisponível</Typography>
          <Typography variant="body2" color="text.secondary">
            Adicione algumas transações para receber sugestões de orçamento baseadas no seu histórico de gastos.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp style={{ width: 16, height: 16, color: theme.palette.error.main }} />;
      case 'down': return <TrendingDown style={{ width: 16, height: 16, color: theme.palette.success.main }} />;
      default: return <ArrowRight style={{ width: 16, height: 16, color: theme.palette.text.secondary }} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'error.main';
      case 'down': return 'success.main';
      default: return 'text.secondary';
    }
  };

  return (
    <Stack spacing={3}>
      {/* Resumo Geral */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <BarChart3 style={{ width: 20, height: 20 }} />
              <Typography variant="h6">Análise dos Seus Gastos</Typography>
            </Stack>
          }
          subheader={`Baseado em ${analysisData.transactionCount} transações dos últimos ${analysisData.analysisPeriod}`}
        />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" fontWeight="bold">{formatCurrency(analysisData.totalSpent)}</Typography>
              <Typography variant="caption" color="text.secondary">Total Gasto</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" fontWeight="bold">{formatCurrency(analysisData.averageMonthlyTotal)}</Typography>
              <Typography variant="caption" color="text.secondary">Média Mensal</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" fontWeight="bold">{analysisData.categories.length}</Typography>
              <Typography variant="caption" color="text.secondary">Categorias</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="h5" fontWeight="bold">{analysisData.transactionCount}</Typography>
              <Typography variant="caption" color="text.secondary">Transações</Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Análise por Categoria */}
      <Card>
        <CardHeader
          title="Sugestões de Orçamento por Categoria"
          subheader="Baseado no seu padrão de gastos e tendências identificadas"
        />
        <CardContent>
          <Stack spacing={3}>
            {analysisData.categories.map((category, index) => {
              const percentageOfTotal = (category.averageMonthly / analysisData.averageMonthlyTotal) * 100;
              
              return (
                <Paper key={category.category} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small" 
                          color={index < 3 ? 'primary' : 'default'} 
                          variant={index < 3 ? 'filled' : 'outlined'}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">{category.category}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.transactionCount} transações • {percentageOfTotal.toFixed(1)}% dos gastos
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getTrendIcon(category.trend)}
                        <Typography variant="body2" fontWeight="medium" color={getTrendColor(category.trend)}>
                          {category.trend === 'stable' ? 'Estável' : 
                           `${category.trend === 'up' ? '+' : '-'}${category.trendPercentage.toFixed(1)}%`}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, textAlign: 'center' }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">{formatCurrency(category.averageMonthly)}</Typography>
                        <Typography variant="caption" color="text.secondary">Média Atual</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">{formatCurrency(category.suggestedBudget)}</Typography>
                        <Typography variant="caption" color="text.secondary">Orçamento Sugerido</Typography>
                      </Box>
                      <Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onBudgetSuggestionAccepted?.(category.category, category.suggestedBudget)}
                          fullWidth
                          startIcon={<CheckCircle size={16} />}
                        >
                          Criar
                        </Button>
                      </Box>
                    </Box>

                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">Gastos vs Sugestão</Typography>
                        <Typography variant="caption">
                          {category.averageMonthly <= category.suggestedBudget ? 
                            `${formatCurrency(category.suggestedBudget - category.averageMonthly)} de margem` :
                            `${formatCurrency(category.averageMonthly - category.suggestedBudget)} acima`
                          }
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((category.averageMonthly / category.suggestedBudget) * 100, 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {category.trend === 'up' && (
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), borderColor: alpha(theme.palette.error.main, 0.3), display: 'flex', gap: 1.5 }}>
                        <AlertCircle style={{ width: 16, height: 16, color: theme.palette.error.main, marginTop: 2 }} />
                        <Box>
                          <Typography variant="body2" color="error.dark">
                            <Box component="strong">Atenção:</Box> Gastos crescentes nesta categoria.
                          </Typography>
                          <Typography variant="caption" color="error.dark">
                            Monitore de perto para evitar que o orçamento seja estourado.
                          </Typography>
                        </Box>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              );
            })}

            <Divider />

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">Total dos Orçamentos Sugeridos</Typography>
                <Typography variant="caption" color="text.secondary">
                  Soma de todas as categorias analisadas
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(analysisData.categories.reduce((sum, cat) => sum + cat.suggestedBudget, 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs {formatCurrency(analysisData.averageMonthlyTotal)} gasto atual
                </Typography>
              </Box>
            </Paper>

            <Button 
              variant="contained"
              onClick={() => {
                analysisData.categories.forEach(cat => {
                  onBudgetSuggestionAccepted?.(cat.category, cat.suggestedBudget);
                });
              }}
              fullWidth
              startIcon={<CheckCircle />}
            >
              Criar Todos os Orçamentos Sugeridos
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}