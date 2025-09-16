// src/components/budgets/budget-guidance.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  InfoIcon,
  DollarSign,
  Home,
  Utensils,
  Car,
  Gamepad2,
  Heart,
  PiggyBank,
  RefreshCw,
  Lightbulb,
  Target
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BudgetCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  percentage: number;
  color: string;
  description: string;
  priority: 'essential' | 'important' | 'optional';
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  {
    id: 'housing',
    name: 'Moradia',
    icon: Home,
    percentage: 35,
    color: 'bg-blue-500',
    description: 'Aluguel, água, luz, internet, condomínio',
    priority: 'essential'
  },
  {
    id: 'food',
    name: 'Alimentação',
    icon: Utensils,
    percentage: 25,
    color: 'bg-green-500',
    description: 'Supermercado, refeições, restaurantes',
    priority: 'essential'
  },
  {
    id: 'transport',
    name: 'Transporte',
    icon: Car,
    percentage: 10,
    color: 'bg-yellow-500',
    description: 'Combustível, Uber, ônibus, manutenção',
    priority: 'important'
  },
  {
    id: 'leisure',
    name: 'Lazer',
    icon: Gamepad2,
    percentage: 10,
    color: 'bg-purple-500',
    description: 'Netflix, Spotify, saídas, entretenimento',
    priority: 'optional'
  },
  {
    id: 'health',
    name: 'Saúde',
    icon: Heart,
    percentage: 5,
    color: 'bg-red-500',
    description: 'Farmácia, consultas, plano de saúde',
    priority: 'important'
  },
  {
    id: 'savings',
    name: 'Reservas',
    icon: PiggyBank,
    percentage: 10,
    color: 'bg-emerald-600',
    description: 'Emergências, investimentos, poupança',
    priority: 'important'
  },
  {
    id: 'others',
    name: 'Outros',
    icon: RefreshCw,
    percentage: 5,
    color: 'bg-gray-500',
    description: 'PIX, imprevistos, gastos diversos',
    priority: 'optional'
  }
];

interface BudgetGuidanceProps {
  onBudgetCreated?: (categories: any[]) => void;
}

export function BudgetGuidance({ onBudgetCreated }: BudgetGuidanceProps) {
  const [income, setIncome] = useState<string>('');
  const [debts, setDebts] = useState<string>('');
  const [fixedExpenses, setFixedExpenses] = useState<string>('');
  const [futureIncome, setFutureIncome] = useState<string>('');
  const [futureDate, setFutureDate] = useState<string>('');
  const [categories, setCategories] = useState<BudgetCategory[]>(DEFAULT_CATEGORIES);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFutureScenario, setShowFutureScenario] = useState(false);

  const numericIncome = parseFloat(income) || 0;
  const numericDebts = parseFloat(debts) || 0;
  const numericFixed = parseFloat(fixedExpenses) || 0;
  const numericFutureIncome = parseFloat(futureIncome) || 0;
  const availableIncome = numericIncome - numericDebts;
  const remainingAfterFixed = availableIncome - numericFixed;
  const futureAvailableIncome = numericFutureIncome - numericDebts;

  // Recalcular percentuais se há gastos fixos muito altos
  const adjustedCategories = useMemo(() => {
    if (numericFixed === 0 || availableIncome === 0) return categories;
    
    const fixedPercentage = (numericFixed / availableIncome) * 100;
    
    if (fixedPercentage > 50) {
      // Situação crítica - ajustar percentuais
      return categories.map(cat => {
        if (cat.id === 'housing') {
          return { ...cat, percentage: fixedPercentage };
        }
        
        const remainingPercentage = 100 - fixedPercentage;
        const otherCategories = categories.filter(c => c.id !== 'housing');
        const totalOtherPercentage = otherCategories.reduce((sum, c) => sum + c.percentage, 0);
        
        return {
          ...cat,
          percentage: (cat.percentage / totalOtherPercentage) * remainingPercentage
        };
      });
    }
    
    return categories;
  }, [categories, numericFixed, availableIncome]);

  const totalPercentage = adjustedCategories.reduce((sum, cat) => sum + cat.percentage, 0);
  const isOverBudget = remainingAfterFixed < 0;
  const budgetTightness = numericFixed / availableIncome;

  const getBudgetStatus = () => {
    if (isOverBudget) return 'critical';
    if (budgetTightness > 0.7) return 'tight';
    if (budgetTightness > 0.5) return 'moderate';
    return 'healthy';
  };

  const getStatusInfo = () => {
    const status = getBudgetStatus();
    
    switch (status) {
      case 'critical':
        return {
          title: '🚨 Situação Crítica',
          description: 'Suas despesas superam sua renda. Ação urgente necessária!',
          color: 'destructive',
          suggestions: [
            'Renegociar empréstimos para reduzir parcelas mensais',
            'Revisar aluguel ou considerar compartilhar moradia',
            'Cortar gastos supérfluos temporariamente',
            'Buscar renda extra urgentemente'
          ]
        };
      case 'tight':
        return {
          title: '⚠️ Orçamento Apertado',
          description: 'Mais de 70% da renda comprometida. Cuidado com imprevistos.',
          color: 'destructive',
          suggestions: [
            'Manter reserva mínima de emergência',
            'Evitar novos gastos parcelados',
            'Focar em aumentar renda quando possível',
            'Controlar rigorosamente gastos variáveis'
          ]
        };
      case 'moderate':
        return {
          title: '📊 Situação Controlável',
          description: 'Orçamento equilibrado, mas com pouca margem para imprevistos.',
          color: 'default',
          suggestions: [
            'Manter disciplina nos gastos',
            'Aumentar reservas gradualmente',
            'Monitorar gastos mensalmente',
            'Planejar grandes compras com antecedência'
          ]
        };
      default:
        return {
          title: '✅ Situação Saudável',
          description: 'Boa margem para poupança e imprevistos.',
          color: 'default',
          suggestions: [
            'Aumentar percentual de investimentos',
            'Criar múltiplas reservas (emergência, objetivos)',
            'Considerar metas de longo prazo',
            'Manter disciplina para não aumentar gastos'
          ]
        };
    }
  };

  const statusInfo = getStatusInfo();

  const updateCategoryPercentage = (categoryId: string, newPercentage: number) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, percentage: Math.max(0, Math.min(100, newPercentage)) }
          : cat
      )
    );
  };

  const resetToDefaults = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  const createBudgetsFromPlan = () => {
    const budgetPlan = adjustedCategories.map(cat => ({
      name: cat.name,
      category: cat.name,
      amount: (availableIncome * cat.percentage) / 100,
      percentage: cat.percentage
    }));
    
    onBudgetCreated?.(budgetPlan);
  };

  return (
    <div className="space-y-6">
      {/* Calculadora de Renda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Orçamento
          </CardTitle>
          <CardDescription>
            Informe seus dados para receber um orçamento personalizado baseado na sua situação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="income">Renda Líquida Mensal</Label>
              <Input
                id="income"
                type="number"
                placeholder="3100"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="debts">Dívidas/Empréstimos Mensais</Label>
              <Input
                id="debts"
                type="number"
                placeholder="1800"
                value={debts}
                onChange={(e) => setDebts(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fixed">Gastos Fixos (Aluguel + Contas)</Label>
              <Input
                id="fixed"
                type="number"
                placeholder="1400"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
              />
            </div>
          </div>

          {/* Cenário Futuro */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="future-scenario"
                checked={showFutureScenario}
                onChange={(e) => setShowFutureScenario(e.target.checked)}
              />
              <Label htmlFor="future-scenario" className="text-sm font-medium">
                Planejar cenário futuro (mudança de renda)
              </Label>
            </div>
            
            {showFutureScenario && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div>
                  <Label htmlFor="future-income">Renda Futura</Label>
                  <Input
                    id="future-income"
                    type="number"
                    placeholder="5333"
                    value={futureIncome}
                    onChange={(e) => setFutureIncome(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="future-date">A partir de quando?</Label>
                  <Input
                    id="future-date"
                    type="text"
                    placeholder="Janeiro 2026"
                    value={futureDate}
                    onChange={(e) => setFutureDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {numericIncome > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(numericIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground">Renda Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(numericDebts)}
                  </p>
                  <p className="text-xs text-muted-foreground">Dívidas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(availableIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground">Renda Disponível</p>
                </div>
                <div>
                  <p className={cn(
                    "text-2xl font-bold",
                    remainingAfterFixed >= 0 ? "text-green-600" : "text-red-500"
                  )}>
                    {formatCurrency(remainingAfterFixed)}
                  </p>
                  <p className="text-xs text-muted-foreground">Após Gastos Fixos</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status do Orçamento */}
      {numericIncome > 0 && (
        <Alert className={cn(
          statusInfo.color === 'destructive' && "border-red-200 bg-red-50 text-red-800"
        )}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{statusInfo.title}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">{statusInfo.description}</p>
            <div className="space-y-1">
              <p className="font-semibold">Estratégias recomendadas:</p>
              <ul className="list-disc list-inside space-y-1">
                {statusInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm">{suggestion}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Distribuição por Categorias */}
      {availableIncome > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Distribuição Recomendada
                </CardTitle>
                <CardDescription>
                  Percentuais sugeridos baseados na sua situação financeira
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Simples' : 'Avançado'}
                </Button>
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  Resetar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {adjustedCategories.map((category) => {
                const amount = (availableIncome * category.percentage) / 100;
                const Icon = category.icon;
                
                return (
                  <div key={category.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className={cn("p-2 rounded-lg text-white", category.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge variant={
                          category.priority === 'essential' ? 'destructive' :
                          category.priority === 'important' ? 'default' : 'secondary'
                        }>
                          {category.priority === 'essential' ? 'Essencial' :
                           category.priority === 'important' ? 'Importante' : 'Opcional'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    
                    <div className="text-right">
                      {showAdvanced ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={category.percentage.toFixed(1)}
                            onChange={(e) => updateCategoryPercentage(category.id, parseFloat(e.target.value))}
                            className="w-16 h-8"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      ) : (
                        <p className="text-sm font-medium">{category.percentage.toFixed(1)}%</p>
                      )}
                      <p className="text-lg font-bold">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold">Total:</span>
              <div className="text-right">
                <p className={cn(
                  "text-sm",
                  Math.abs(totalPercentage - 100) > 0.1 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {totalPercentage.toFixed(1)}%
                </p>
                <p className="text-lg font-bold">{formatCurrency(availableIncome)}</p>
              </div>
            </div>

            {Math.abs(totalPercentage - 100) > 0.1 && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Os percentuais devem somar 100%. Atualmente: {totalPercentage.toFixed(1)}%
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={createBudgetsFromPlan}
                disabled={Math.abs(totalPercentage - 100) > 0.1}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Criar Orçamentos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cenário Futuro */}
      {showFutureScenario && numericFutureIncome > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cenário Futuro: {futureDate}
            </CardTitle>
            <CardDescription>
              Como ficará seu orçamento quando a renda mudar para {formatCurrency(numericFutureIncome)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center p-4 bg-muted rounded-lg">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(numericFutureIncome)}
                </p>
                <p className="text-xs text-muted-foreground">Renda Futura</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(futureAvailableIncome)}
                </p>
                <p className="text-xs text-muted-foreground">Disponível</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(futureAvailableIncome - numericFixed)}
                </p>
                <p className="text-xs text-muted-foreground">Após Gastos Fixos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(futureAvailableIncome - availableIncome)}
                </p>
                <p className="text-xs text-muted-foreground">Diferença</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Recomendações para o cenário futuro:</h4>
              <div className="grid gap-2">
                {futureAvailableIncome > availableIncome ? (
                  <>
                    <div className="p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>✅ Aumento de {formatCurrency(futureAvailableIncome - availableIncome)}</strong>
                        <br />
                        Priorize: Reserva de emergência (20%), investimentos (15%), e melhore qualidade de vida moderadamente.
                      </p>
                    </div>
                    <div className="p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>💡 Sugestão de distribuição futura:</strong>
                        <br />
                        Moradia: {((numericFixed / futureAvailableIncome) * 100).toFixed(1)}% • 
                        Poupança: 20% • Lazer: 15% • Alimentação: 20%
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <strong>⚠️ Redução de renda prevista</strong>
                      <br />
                      Prepare-se: Aumente reservas agora, renegocie dívidas, considere reduzir gastos fixos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas Extras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Dicas para Situações Específicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                🏠 Quando aluguel + contas passam de 40% da renda
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Considere dividir o aluguel, negociar com proprietário ou buscar um local mais barato. 
                Acima de 40% compromete muito o orçamento familiar.
              </p>
            </div>

            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20">
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                💳 Quando empréstimos passam de 30% da renda
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Priorize renegociar para alongar parcelas. Mesmo aumentando o prazo total, 
                é melhor que quebrar o orçamento mensal e acumular mais dívidas.
              </p>
            </div>

            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                📊 Analisando seus gastos históricos
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Use suas transações passadas para identificar padrões reais de gasto. 
                Muitas vezes gastamos mais em determinadas categorias do que imaginamos.
              </p>
            </div>

            <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                💰 Regra 50/30/20 para situações normais
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                50% necessidades, 30% desejos, 20% poupança. Mas adapte à sua realidade: 
                se está endividado, priorize quitação antes de focar em poupança.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}