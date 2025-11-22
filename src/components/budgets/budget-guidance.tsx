// src/components/budgets/budget-guidance.tsx

import React, { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Button, 
  TextField, 
  LinearProgress, 
  Chip, 
  Divider, 
  Alert, 
  AlertTitle, 
  Box, 
  Stack, 
  Paper,
  useTheme,
  alpha,
  InputAdornment,
  Checkbox
} from '@mui/material';
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

  const theme = useTheme();

  return (
    <Stack spacing={3}>
      {/* Calculadora de Renda */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Calculator style={{ width: 20, height: 20 }} />
              <Typography variant="h6">Calculadora de Orçamento</Typography>
            </Stack>
          }
          subheader="Informe seus dados para receber um orçamento personalizado baseado na sua situação"
        />
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <TextField
                label="Renda Líquida Mensal"
                type="number"
                placeholder="3100"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                fullWidth
              />
              <TextField
                label="Dívidas/Empréstimos Mensais"
                type="number"
                placeholder="1800"
                value={debts}
                onChange={(e) => setDebts(e.target.value)}
                fullWidth
              />
              <TextField
                label="Gastos Fixos (Aluguel + Contas)"
                type="number"
                placeholder="1400"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                fullWidth
              />
            </Box>

            {/* Cenário Futuro */}
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  id="future-scenario"
                  checked={showFutureScenario}
                  onChange={(e) => setShowFutureScenario(e.target.checked)}
                />
                <Typography component="label" htmlFor="future-scenario" variant="body2" fontWeight="medium" sx={{ cursor: 'pointer' }}>
                  Planejar cenário futuro (mudança de renda)
                </Typography>
              </Stack>
              
              {showFutureScenario && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderColor: alpha(theme.palette.info.main, 0.2) }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                    <TextField
                      label="Renda Futura"
                      type="number"
                      placeholder="5333"
                      value={futureIncome}
                      onChange={(e) => setFutureIncome(e.target.value)}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="A partir de quando?"
                      placeholder="Janeiro 2026"
                      value={futureDate}
                      onChange={(e) => setFutureDate(e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Box>
                </Paper>
              )}
            </Stack>

            {numericIncome > 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, textAlign: 'center' }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {formatCurrency(numericIncome)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Renda Total</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="error.main">
                      {formatCurrency(numericDebts)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Dívidas</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {formatCurrency(availableIncome)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Renda Disponível</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color={remainingAfterFixed >= 0 ? "success.main" : "error.main"}>
                      {formatCurrency(remainingAfterFixed)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Após Gastos Fixos</Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Status do Orçamento */}
      {numericIncome > 0 && (
        <Alert severity={statusInfo.color === 'destructive' ? 'error' : 'info'} icon={<AlertTriangle />}>
          <AlertTitle>{statusInfo.title}</AlertTitle>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" paragraph>{statusInfo.description}</Typography>
            <Typography variant="subtitle2" gutterBottom>Estratégias recomendadas:</Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {statusInfo.suggestions.map((suggestion, index) => (
                <Typography component="li" variant="body2" key={index}>{suggestion}</Typography>
              ))}
            </Box>
          </Box>
        </Alert>
      )}

      {/* Distribuição por Categorias */}
      {availableIncome > 0 && (
        <Card>
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Target style={{ width: 20, height: 20 }} />
                  <Typography variant="h6">Distribuição Recomendada</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Simples' : 'Avançado'}
                  </Button>
                  <Button variant="outlined" size="small" onClick={resetToDefaults}>
                    Resetar
                  </Button>
                </Stack>
              </Stack>
            }
            subheader="Percentuais sugeridos baseados na sua situação financeira"
          />
          <CardContent>
            <Stack spacing={2}>
              <Stack spacing={2}>
                {adjustedCategories.map((category) => {
                  const amount = (availableIncome * category.percentage) / 100;
                  const Icon = category.icon;
                  
                  return (
                    <Paper key={category.id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: category.color.replace('bg-', '').replace('-500', '.main').replace('-600', '.dark'), // This is a hack, ideally use theme colors or map properly
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon style={{ width: 16, height: 16 }} />
                      </Box>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2">{category.name}</Typography>
                          <Chip 
                            label={category.priority === 'essential' ? 'Essencial' : category.priority === 'important' ? 'Importante' : 'Opcional'} 
                            size="small"
                            color={category.priority === 'essential' ? 'error' : category.priority === 'important' ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{category.description}</Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        {showAdvanced ? (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TextField
                              type="number"
                              value={category.percentage.toFixed(1)}
                              onChange={(e) => updateCategoryPercentage(category.id, parseFloat(e.target.value))}
                              size="small"
                              sx={{ width: 80 }}
                              inputProps={{ min: 0, max: 100, step: 0.1 }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                            />
                          </Stack>
                        ) : (
                          <Typography variant="subtitle2">{category.percentage.toFixed(1)}%</Typography>
                        )}
                        <Typography variant="h6" fontWeight="bold">{formatCurrency(amount)}</Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>

              <Divider />

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography 
                    variant="body2" 
                    color={Math.abs(totalPercentage - 100) > 0.1 ? "error.main" : "text.secondary"}
                  >
                    {totalPercentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">{formatCurrency(availableIncome)}</Typography>
                </Box>
              </Paper>

              {Math.abs(totalPercentage - 100) > 0.1 && (
                <Alert severity="warning" icon={<InfoIcon />}>
                  <AlertTitle>Atenção</AlertTitle>
                  Os percentuais devem somar 100%. Atualmente: {totalPercentage.toFixed(1)}%
                </Alert>
              )}

              <Button 
                variant="contained"
                onClick={createBudgetsFromPlan}
                disabled={Math.abs(totalPercentage - 100) > 0.1}
                startIcon={<CheckCircle />}
                fullWidth
              >
                Criar Orçamentos
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Cenário Futuro */}
      {showFutureScenario && numericFutureIncome > 0 && (
        <Card>
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp style={{ width: 20, height: 20 }} />
                <Typography variant="h6">Cenário Futuro: {futureDate}</Typography>
              </Stack>
            }
            subheader={`Como ficará seu orçamento quando a renda mudar para ${formatCurrency(numericFutureIncome)}`}
          />
          <CardContent>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, textAlign: 'center' }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {formatCurrency(numericFutureIncome)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Renda Futura</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {formatCurrency(futureAvailableIncome)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Disponível</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="success.dark">
                      {formatCurrency(futureAvailableIncome - numericFixed)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Após Gastos Fixos</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="secondary.main">
                      {formatCurrency(futureAvailableIncome - availableIncome)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Diferença</Typography>
                  </Box>
                </Box>
              </Paper>

              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight="bold">Recomendações para o cenário futuro:</Typography>
                <Stack spacing={2}>
                  {futureAvailableIncome > availableIncome ? (
                    <>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: alpha(theme.palette.success.main, 0.3), borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
                        <Typography variant="body2" color="success.dark">
                          <Box component="strong" display="block">✅ Aumento de {formatCurrency(futureAvailableIncome - availableIncome)}</Box>
                          Priorize: Reserva de emergência (20%), investimentos (15%), e melhore qualidade de vida moderadamente.
                        </Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.3), borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
                        <Typography variant="body2" color="info.dark">
                          <Box component="strong" display="block">💡 Sugestão de distribuição futura:</Box>
                          Moradia: {((numericFixed / futureAvailableIncome) * 100).toFixed(1)}% • 
                          Poupança: 20% • Lazer: 15% • Alimentação: 20%
                        </Typography>
                      </Paper>
                    </>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderColor: alpha(theme.palette.warning.main, 0.3), borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
                      <Typography variant="body2" color="warning.dark">
                        <Box component="strong" display="block">⚠️ Redução de renda prevista</Box>
                        Prepare-se: Aumente reservas agora, renegocie dívidas, considere reduzir gastos fixos.
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Dicas Extras */}
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Lightbulb style={{ width: 20, height: 20 }} />
              <Typography variant="h6">Dicas para Situações Específicas</Typography>
            </Stack>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderColor: alpha(theme.palette.warning.main, 0.3), borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
              <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                🏠 Quando aluguel + contas passam de 40% da renda
              </Typography>
              <Typography variant="body2" color="warning.dark">
                Considere dividir o aluguel, negociar com proprietário ou buscar um local mais barato. 
                Acima de 40% compromete muito o orçamento familiar.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderColor: alpha(theme.palette.error.main, 0.3), borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
              <Typography variant="subtitle2" color="error.dark" gutterBottom>
                💳 Quando empréstimos passam de 30% da renda
              </Typography>
              <Typography variant="body2" color="error.dark">
                Priorize renegociar para alongar parcelas. Mesmo aumentando o prazo total, 
                é melhor que quebrar o orçamento mensal e acumular mais dívidas.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.3), borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
              <Typography variant="subtitle2" color="info.dark" gutterBottom>
                📊 Analisando seus gastos históricos
              </Typography>
              <Typography variant="body2" color="info.dark">
                Use suas transações passadas para identificar padrões reais de gasto. 
                Muitas vezes gastamos mais em determinadas categorias do que imaginamos.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: alpha(theme.palette.success.main, 0.3), borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
              <Typography variant="subtitle2" color="success.dark" gutterBottom>
                💰 Regra 50/30/20 para situações normais
              </Typography>
              <Typography variant="body2" color="success.dark">
                50% necessidades, 30% desejos, 20% poupança. Mas adapte à sua realidade: 
                se está endividado, priorize quitação antes de focar em poupança.
              </Typography>
            </Paper>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}