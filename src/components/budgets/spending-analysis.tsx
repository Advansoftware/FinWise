// src/components/budgets/spending-analysis.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
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

  if (!analysisData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Análise Indisponível</h3>
          <p className="text-muted-foreground">
            Adicione algumas transações para receber sugestões de orçamento baseadas no seu histórico de gastos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <ArrowRight className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-500';
      case 'down': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise dos Seus Gastos
          </CardTitle>
          <CardDescription>
            Baseado em {analysisData.transactionCount} transações dos últimos {analysisData.analysisPeriod}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatCurrency(analysisData.totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Total Gasto</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatCurrency(analysisData.averageMonthlyTotal)}</p>
              <p className="text-xs text-muted-foreground">Média Mensal</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{analysisData.categories.length}</p>
              <p className="text-xs text-muted-foreground">Categorias</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{analysisData.transactionCount}</p>
              <p className="text-xs text-muted-foreground">Transações</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Sugestões de Orçamento por Categoria</CardTitle>
          <CardDescription>
            Baseado no seu padrão de gastos e tendências identificadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysisData.categories.map((category, index) => {
            const percentageOfTotal = (category.averageMonthly / analysisData.averageMonthlyTotal) * 100;
            
            return (
              <div key={category.category} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <h4 className="font-medium">{category.category}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.transactionCount} transações • {percentageOfTotal.toFixed(1)}% dos gastos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(category.trend)}
                    <span className={cn("text-sm font-medium", getTrendColor(category.trend))}>
                      {category.trend === 'stable' ? 'Estável' : 
                       `${category.trend === 'up' ? '+' : '-'}${category.trendPercentage.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(category.averageMonthly)}</p>
                    <p className="text-xs text-muted-foreground">Média Atual</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(category.suggestedBudget)}</p>
                    <p className="text-xs text-muted-foreground">Orçamento Sugerido</p>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onBudgetSuggestionAccepted?.(category.category, category.suggestedBudget)}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Criar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gastos vs Sugestão</span>
                    <span>
                      {category.averageMonthly <= category.suggestedBudget ? 
                        `${formatCurrency(category.suggestedBudget - category.averageMonthly)} de margem` :
                        `${formatCurrency(category.averageMonthly - category.suggestedBudget)} acima`
                      }
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((category.averageMonthly / category.suggestedBudget) * 100, 100)}
                    className="h-2"
                  />
                </div>

                {category.trend === 'up' && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-700 dark:text-red-300">
                        <strong>Atenção:</strong> Gastos crescentes nesta categoria.
                      </p>
                      <p className="text-red-600 dark:text-red-400 mt-1">
                        Monitore de perto para evitar que o orçamento seja estourado.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Separator />

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium">Total dos Orçamentos Sugeridos</h4>
              <p className="text-sm text-muted-foreground">
                Soma de todas as categorias analisadas
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatCurrency(analysisData.categories.reduce((sum, cat) => sum + cat.suggestedBudget, 0))}
              </p>
              <p className="text-sm text-muted-foreground">
                vs {formatCurrency(analysisData.averageMonthlyTotal)} gasto atual
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Button 
              onClick={() => {
                analysisData.categories.forEach(cat => {
                  onBudgetSuggestionAccepted?.(cat.category, cat.suggestedBudget);
                });
              }}
              className="w-full"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Criar Todos os Orçamentos Sugeridos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}