// src/components/installments/monthly-projections.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useInstallments } from '@/hooks/use-installments';
import { formatCurrency } from '@/lib/utils';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyProjection {
  month: string;
  totalCommitment: number;
  installments: Array<{
    installmentId: string;
    name: string;
    amount: number;
  }>;
}

export function MonthlyProjections() {
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [includePastMonths, setIncludePastMonths] = useState(6);
  
  const { getMonthlyProjections } = useInstallments();

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

  const totalCommitment = projections.reduce((sum, p) => sum + p.totalCommitment, 0);
  const averageCommitment = projections.length > 0 ? totalCommitment / projections.length : 0;
  const maxCommitment = Math.max(...projections.map(p => p.totalCommitment), 0);

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

      {/* Projections */}
      {projections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma projeção disponível</h3>
            <p className="text-muted-foreground text-center">
              Não há parcelas previstas para o período selecionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projections.map((projection) => (
            <Card key={projection.month} className="relative">
              <CardHeader className="pb-3">
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
                    <p className="text-sm font-medium">Parcelamentos:</p>
                    <div className="space-y-1">
                      {projection.installments.slice(0, 3).map((installment, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="truncate flex-1 mr-2">{installment.name}</span>
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

                {/* Visual indicator */}
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ 
                      width: `${maxCommitment > 0 ? (projection.totalCommitment / maxCommitment) * 100 : 0}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
