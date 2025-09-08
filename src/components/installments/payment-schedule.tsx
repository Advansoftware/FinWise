// src/components/installments/payment-schedule.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { InstallmentPayment } from '@/core/ports/installments.port';
import { useInstallments } from '@/hooks/use-installments';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function PaymentSchedule() {
  const [upcomingPayments, setUpcomingPayments] = useState<InstallmentPayment[]>([]);
  const [overduePayments, setOverduePayments] = useState<InstallmentPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900/50',
          label: 'Pago'
        };
      } else if (isPast(dueDate) && !isToday(dueDate)) {
        return {
          icon: AlertTriangle,
          color: 'text-destructive dark:text-destructive',
          bgColor: 'bg-destructive/10 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/20',
          label: 'Em Atraso'
        };
      } else if (isToday(dueDate)) {
        return {
          icon: Clock,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900/50',
          label: 'Vence Hoje'
        };
      } else {
        return {
          icon: Calendar,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50',
          label: 'Pendente'
        };
      }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
      <Card className={`${statusInfo.bgColor} transition-all hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                <Badge variant="outline" className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>
              
              <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                {installmentName}
              </h4>
              
              <p className="text-xs text-muted-foreground mb-2">
                Parcela {payment.installmentNumber}
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium text-sm">
                    {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-semibold">
                    {formatCurrency(payment.paidAmount || payment.scheduledAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Próximos Vencimentos ({upcomingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Em Atraso ({overduePayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingPayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum vencimento próximo</h3>
                <p className="text-muted-foreground text-center">
                  Você está em dia com seus pagamentos! Não há parcelas para vencer nos próximos 60 dias.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPayments.map((payment) => (
                <PaymentCard key={`${payment.installmentId}-${payment.installmentNumber}`} payment={payment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overduePayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma parcela em atraso</h3>
                <p className="text-muted-foreground text-center">
                  Parabéns! Você está em dia com todos os seus parcelamentos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="bg-destructive/10 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive dark:text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive dark:text-destructive">Atenção: Parcelas em Atraso</h4>
                    <p className="text-sm text-destructive/80 dark:text-destructive/80 mt-1">
                      Você tem {overduePayments.length} parcela(s) em atraso. 
                      Considere quitar esses pagamentos o quanto antes.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overduePayments.map((payment) => (
                  <PaymentCard key={`${payment.installmentId}-${payment.installmentNumber}`} payment={payment} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
