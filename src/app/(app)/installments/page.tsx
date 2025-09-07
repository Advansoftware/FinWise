// src/app/(app)/installments/page.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { useInstallments } from '@/hooks/use-installments';
import { CreateInstallmentDialog } from '@/components/installments/create-installment-dialog';
import { InstallmentCard } from '@/components/installments/installment-card';
import { PaymentSchedule } from '@/components/installments/payment-schedule';
import { MonthlyProjections } from '@/components/installments/monthly-projections';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function InstallmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { installments, summary, isLoading } = useInstallments();

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <Skeleton className="h-96" />
      </div>
    );
  }

  const activeInstallments = installments.filter(i => i.isActive && !i.isCompleted);
  const completedInstallments = installments.filter(i => i.isCompleted);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parcelamentos</h1>
          <p className="text-muted-foreground">
            Gerencie suas prestações, acompanhe pagamentos e projete compromissos futuros.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Parcelamento
        </Button>
      </div>

      {/* Alerta de Atraso */}
      {summary && summary.overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-700">
                {summary.overduePayments.length} Parcela{summary.overduePayments.length > 1 ? 's' : ''} em Atraso
              </CardTitle>
            </div>
            <CardDescription className="text-red-600">
              Você tem pagamentos vencidos que precisam de atenção imediata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              {summary.overduePayments.slice(0, 3).map((payment) => {
                const installment = installments.find(inst => 
                  inst.payments.some(p => p.id === payment.id)
                );
                const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                    <div className="flex-1">
                      <div className="font-medium text-red-900">
                        {installment?.name || 'Parcelamento'} - Parcela {payment.installmentNumber}
                      </div>
                      <div className="text-sm text-red-600">
                        Venceu em {new Date(payment.dueDate).toLocaleDateString('pt-BR')} • {daysOverdue} dias de atraso
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-700">
                        {formatCurrency(payment.scheduledAmount)}
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Em Atraso
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {summary.overduePayments.length > 3 && (
              <div className="text-sm text-red-600 text-center py-2 border-t border-red-200">
                E mais {summary.overduePayments.length - 3} parcela{summary.overduePayments.length - 3 > 1 ? 's' : ''} em atraso
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 flex-1">
                Quitar Pendências
              </Button>
              <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                Ver Cronograma
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parcelamentos Ativos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalActiveInstallments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeInstallments.length} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compromisso Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalMonthlyCommitment || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total das parcelas mensais
            </p>
          </CardContent>
        </Card>

        <Card className={summary && summary.overduePayments.length > 0 ? "border-red-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {summary && summary.overduePayments.length > 0 ? "Parcelas em Atraso" : "Próximos Vencimentos"}
            </CardTitle>
            {summary && summary.overduePayments.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary && summary.overduePayments.length > 0 ? "text-red-600" : ""}`}>
              {summary && summary.overduePayments.length > 0 
                ? summary.overduePayments.length 
                : summary?.upcomingPayments.length || 0
              }
            </div>
            <p className={`text-xs ${summary && summary.overduePayments.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {summary && summary.overduePayments.length > 0 
                ? "Precisam de atenção" 
                : "Próximos 30 dias"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary?.overduePayments.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Parcelas vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="schedule">Cronograma</TabsTrigger>
          <TabsTrigger value="projections">Projeções</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeInstallments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum parcelamento ativo</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando seu primeiro parcelamento para acompanhar suas prestações.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Parcelamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeInstallments.map((installment) => (
                <InstallmentCard 
                  key={installment.id} 
                  installment={installment}
                  showActions
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <PaymentSchedule />
        </TabsContent>

        <TabsContent value="projections">
          <MonthlyProjections />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedInstallments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum parcelamento concluído</h3>
                <p className="text-muted-foreground text-center">
                  Parcelamentos que você finalizar aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedInstallments.map((installment) => (
                <InstallmentCard 
                  key={installment.id} 
                  installment={installment}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateInstallmentDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
