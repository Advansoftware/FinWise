// src/components/installments/monthly-projections.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign,
  BarChart3,
  Percent,
  Home,
  CreditCard,
  Repeat,
  Clock
} from 'lucide-react';
import { useInstallments } from '@/hooks/use-installments';
import { usePayroll } from '@/hooks/use-payroll';
import { formatCurrency } from '@/lib/utils';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyInstallmentsModal } from './monthly-installments-modal';

interface MonthlyProjection {
  month: string;
  totalCommitment: number;
  installments: Array<{
    installmentId: string;
    name: string;
    amount: number;
    isRecurring?: boolean; // Adicionar campo para identificar recorrentes
  }>;
}

export function MonthlyProjections() {
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [includePastMonths, setIncludePastMonths] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<{
    month: string;
    monthName: string;
    totalAmount: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('fixed');
  
  const { getMonthlyProjections } = useInstallments();
  const { payrollData } = usePayroll();

  // Separar projeções por tipo
  const getProjectionsByType = (type: 'fixed' | 'variable') => {
    return projections.map(projection => ({
      ...projection,
      installments: projection.installments.filter(installment => 
        type === 'fixed' ? (installment.isRecurring === true) : (installment.isRecurring !== true)
      ),
      totalCommitment: projection.installments
        .filter(installment => 
          type === 'fixed' ? (installment.isRecurring === true) : (installment.isRecurring !== true)
        )
        .reduce((sum, installment) => sum + installment.amount, 0)
    }));
  };

  const fixedProjections = getProjectionsByType('fixed');
  const variableProjections = getProjectionsByType('variable');

  useEffect(() => {
    const loadProjections = async () => {
      setIsLoading(true);
      const data = await getMonthlyProjections(selectedMonths + includePastMonths);
      setProjections(data);
      setIsLoading(false);
    };

    loadProjections();
  }, [getMonthlyProjections, selectedMonths, includePastMonths]);

  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMMM yyyy', { locale: ptBR });
  };

  const calculateSalaryPercentage = (amount: number) => {
    if (!payrollData?.netSalary || payrollData.netSalary <= 0) return null;
    return (amount / payrollData.netSalary) * 100;
  };

  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) return '';
    return `${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage: number | null) => {
    if (percentage === null) return '';
    if (percentage >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (percentage >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const totalCommitment = projections.reduce((sum, p) => sum + p.totalCommitment, 0);
  const averageCommitment = projections.length > 0 ? totalCommitment / projections.length : 0;
  const maxCommitment = Math.max(...projections.map(p => p.totalCommitment), 0);

  const handleCardClick = (projection: MonthlyProjection) => {
    if (projection.installments.length > 0) {
      setSelectedMonth({
        month: projection.month,
        monthName: formatMonthYear(projection.month),
        totalAmount: projection.totalCommitment
      });
    }
  };

  const renderProjectionCards = (projectionsData: MonthlyProjection[], type: 'fixed' | 'variable') => {
    const maxCommitment = Math.max(...projectionsData.map(p => p.totalCommitment), 0);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectionsData.map((projection) => {
          const salaryPercentage = calculateSalaryPercentage(projection.totalCommitment);
          const percentageColor = getPercentageColor(salaryPercentage);
          
          return (
            <Card 
              key={projection.month} 
              className={`relative transition-all duration-200 ${
                projection.installments.length > 0 
                  ? 'cursor-pointer hover:shadow-md hover:scale-105' 
                  : 'opacity-60'
              }`}
              onClick={() => handleCardClick(projection)}
            >
              {/* Indicador de porcentagem do salário */}
              {salaryPercentage !== null && projection.totalCommitment > 0 && (
                <Badge 
                  variant="outline" 
                  className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium ${percentageColor}`}
                >
                  <Percent className="h-3 w-3 mr-1" />
                  {formatPercentage(salaryPercentage)}
                </Badge>
              )}

              {/* Indicador de tipo */}
              <Badge 
                variant="secondary" 
                className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium ${
                  type === 'fixed' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}
              >
                {type === 'fixed' ? (
                  <>
                    <Home className="h-3 w-3 mr-1" />
                    Fixo
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3 w-3 mr-1" />
                    Variável
                  </>
                )}
              </Badge>
              
              <CardHeader className="pb-3 pt-8">
                <CardTitle className="text-lg capitalize">
                  {formatMonthYear(projection.month)}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(projection.totalCommitment)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total do mês
                  </p>
                </div>

                {projection.installments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {type === 'fixed' ? 'Compromissos Fixos:' : 'Parcelamentos:'}
                    </p>
                    <div className="space-y-1">
                      {projection.installments.slice(0, 3).map((installment, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="truncate flex-1 mr-2 flex items-center gap-1">
                            {installment.isRecurring && <Repeat className="h-3 w-3" />}
                            {installment.name}
                          </span>
                          <span className="font-medium">{formatCurrency(installment.amount)}</span>
                        </div>
                      ))}
                      {projection.installments.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{projection.installments.length - 3} mais
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {projection.installments.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Clique para ver detalhes
                  </p>
                )}

                {/* Visual indicator */}
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      type === 'fixed' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${maxCommitment > 0 ? (projection.totalCommitment / maxCommitment) * 100 : 0}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compromisso Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommitment)}</div>
            <p className="text-xs text-muted-foreground">
              Próximos {selectedMonths} + últimos {includePastMonths} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Mensal</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageCommitment)}</div>
            <p className="text-xs text-muted-foreground">
              Valor médio por mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Compromisso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(maxCommitment)}</div>
            <p className="text-xs text-muted-foreground">
              Mês com maior valor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Período futuro:</h3>
          <div className="flex gap-2">
            <Button
              variant={selectedMonths === 6 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMonths(6)}
            >
              6 meses
            </Button>
            <Button
              variant={selectedMonths === 12 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMonths(12)}
            >
              12 meses
            </Button>
            <Button
              variant={selectedMonths === 24 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMonths(24)}
            >
              24 meses
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Incluir histórico:</h3>
          <div className="flex gap-2">
            <Button
              variant={includePastMonths === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIncludePastMonths(0)}
            >
              Nenhum
            </Button>
            <Button
              variant={includePastMonths === 3 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIncludePastMonths(3)}
            >
              3 meses
            </Button>
            <Button
              variant={includePastMonths === 6 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIncludePastMonths(6)}
            >
              6 meses
            </Button>
            <Button
              variant={includePastMonths === 12 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIncludePastMonths(12)}
            >
              12 meses
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs para separar por tipo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fixed" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Comprometimento Fixo
          </TabsTrigger>
          <TabsTrigger value="variable" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Comprometimento Variável
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fixed" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Compromissos Fixos</h3>
              <p className="text-sm text-muted-foreground">
                Gastos recorrentes mensais - o que importa é o impacto mensal no orçamento
              </p>
            </div>
          </div>
          
          {fixedProjections.length === 0 || fixedProjections.every(p => p.totalCommitment === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum compromisso fixo</h3>
                <p className="text-muted-foreground text-center">
                  Não há parcelamentos recorrentes previstos para o período selecionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Card de resumo mensal dos gastos fixos */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Impacto Mensal dos Gastos Fixos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    // Calcular total mensal dos gastos fixos
                    const uniqueFixedCommitments = new Map();
                    fixedProjections.forEach(projection => {
                      projection.installments.forEach(installment => {
                        if (installment.isRecurring === true) {
                          uniqueFixedCommitments.set(installment.name, installment.amount);
                        }
                      });
                    });
                    
                    const totalMonthlyFixed = Array.from(uniqueFixedCommitments.values())
                      .reduce((sum: number, amount: number) => sum + amount, 0);
                    const salaryPercentage = calculateSalaryPercentage(totalMonthlyFixed);
                    
                    return (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(totalMonthlyFixed)}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          Compromisso fixo mensal
                        </p>
                        {salaryPercentage !== null && (
                          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                            <Percent className="h-3 w-3 mr-1" />
                            {formatPercentage(salaryPercentage)} do salário
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Lista dos gastos fixos individuais */}
              <div className="space-y-3">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Detalhamento dos Gastos Fixos:</h4>
                <div className="grid gap-3">
                  {(() => {
                    const uniqueFixedCommitments = new Map();
                    fixedProjections.forEach(projection => {
                      projection.installments.forEach(installment => {
                        if (installment.isRecurring === true) {
                          uniqueFixedCommitments.set(installment.name, {
                            name: installment.name,
                            amount: installment.amount,
                            category: 'Gasto Fixo'
                          });
                        }
                      });
                    });
                    
                    return Array.from(uniqueFixedCommitments.values()).map((commitment: any) => {
                      const salaryPercentage = calculateSalaryPercentage(commitment.amount);
                      const percentageColor = getPercentageColor(salaryPercentage);
                      
                      return (
                        <Card key={commitment.name} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                  <Repeat className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 dark:text-gray-100">{commitment.name}</h5>
                                  <p className="text-xs text-muted-foreground">{commitment.category}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                  {formatCurrency(commitment.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">por mês</p>
                                {salaryPercentage !== null && (
                                  <Badge 
                                    variant="outline" 
                                    className={`mt-1 text-xs ${percentageColor}`}
                                  >
                                    {formatPercentage(salaryPercentage)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="variable" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">Compromissos Variáveis</h3>
              <p className="text-sm text-muted-foreground">
                Empréstimos, financiamentos e parcelamentos com prazo definido
              </p>
            </div>
          </div>
          
          {variableProjections.length === 0 || variableProjections.every(p => p.totalCommitment === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum compromisso variável</h3>
                <p className="text-muted-foreground text-center">
                  Não há parcelamentos com prazo definido previstos para o período selecionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            renderProjectionCards(variableProjections, 'variable')
          )}
        </TabsContent>
      </Tabs>

      {/* Modal */}
      {selectedMonth && (
        <MonthlyInstallmentsModal
          isOpen={!!selectedMonth}
          onOpenChange={(open) => !open && setSelectedMonth(null)}
          month={selectedMonth.month}
          monthName={selectedMonth.monthName}
          totalAmount={selectedMonth.totalAmount}
        />
      )}
    </div>
  );
}
