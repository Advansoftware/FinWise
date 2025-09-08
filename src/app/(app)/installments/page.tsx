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
  PieChart,
  Trophy,
  Award,
  Flame,
  Zap,
  Target
} from 'lucide-react';
import { useInstallments } from '@/hooks/use-installments';
import { CreateInstallmentDialog } from '@/components/installments/create-installment-dialog';
import { InstallmentCard } from '@/components/installments/installment-card';
import { PaymentSchedule } from '@/components/installments/payment-schedule';
import { MonthlyProjections } from '@/components/installments/monthly-projections';
import { GamificationGuide } from '@/components/installments/gamification-guide';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function InstallmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { installments, summary, isLoading } = useInstallments();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parcelamentos</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie suas prestações, acompanhe pagamentos e projete compromissos futuros.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:justify-end">
          <GamificationGuide 
            currentPoints={summary?.gamification.points}
            currentLevel={summary?.gamification.level}
            badges={summary?.gamification.badges}
          />
          <Button onClick={() => setIsCreateOpen(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Parcelamento
          </Button>
        </div>
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
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-red-500/5 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-900/50">
                    <div className="flex-1">
                      <div className="font-medium text-red-900 dark:text-red-400">
                        {installment?.name || 'Parcelamento'} - Parcela {payment.installmentNumber}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Venceu em {new Date(payment.dueDate).toLocaleDateString('pt-BR')} • {daysOverdue} dias de atraso
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-700 dark:text-red-400">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Parcelamentos Ativos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{summary?.totalActiveInstallments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeInstallments.length} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Compromisso Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatCurrency(summary?.totalMonthlyCommitment || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total das parcelas mensais
            </p>
          </CardContent>
        </Card>

        <Card className={`col-span-2 lg:col-span-1 ${summary && summary.overduePayments.length > 0 ? "border-red-200" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">
              {summary && summary.overduePayments.length > 0 ? "Parcelas em Atraso" : "Próximos Vencimentos"}
            </CardTitle>
            {summary && summary.overduePayments.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${summary && summary.overduePayments.length > 0 ? "text-red-600" : ""}`}>
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

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Parcelamentos Quitados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{completedInstallments.length}</div>
            <p className="text-xs text-muted-foreground">
              Finalizados com sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max min-w-full md:grid md:grid-cols-5 h-auto">
            <TabsTrigger value="active" className="text-xs md:text-sm py-2 whitespace-nowrap flex-shrink-0">Ativos</TabsTrigger>
            <TabsTrigger value="gamification" className="text-xs md:text-sm py-2 whitespace-nowrap flex-shrink-0">Progresso</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs md:text-sm py-2 whitespace-nowrap flex-shrink-0">Cronograma</TabsTrigger>
            <TabsTrigger value="projections" className="text-xs md:text-sm py-2 whitespace-nowrap flex-shrink-0">Projeções</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm py-2 whitespace-nowrap flex-shrink-0">Finalizados</TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="gamification" className="space-y-6">
          {summary && (
            <div className="space-y-6">
              {/* Header da Gamificação com Guia */}
              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-700 dark:border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-slate-100 dark:text-slate-100">
                          Nível {summary.gamification.level.level} - {summary.gamification.level.name}
                        </CardTitle>
                        <CardDescription className="text-slate-300 dark:text-slate-300">
                          {summary.gamification.points} pontos acumulados
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex-shrink-0 hidden md:block">
                      <GamificationGuide />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-200 dark:text-slate-200">
                      <span>Progresso para o próximo nível</span>
                      <span>{summary.gamification.level.pointsToNext} pontos restantes</span>
                    </div>
                    <Progress 
                      value={(summary.gamification.points / (summary.gamification.level.pointsRequired + summary.gamification.level.pointsToNext)) * 100} 
                      className="h-3"
                    />
                  </div>
                  
                  {summary.gamification.streak > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-200 dark:border-orange-900/50 rounded-lg">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="font-medium text-orange-700 dark:text-orange-400 text-sm md:text-base break-words">
                        Sequência de {summary.gamification.streak} meses pagando tudo em dia! 🔥
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Badges Conquistadas */}
              {summary.gamification.badges.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Badges Conquistadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {summary.gamification.badges.map((badge) => (
                        <motion.div
                          key={badge.id}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="text-center p-4 border rounded-lg bg-gradient-to-b from-yellow-50 to-yellow-100 border-yellow-200"
                        >
                          <div className="text-3xl mb-2">{badge.icon}</div>
                          <h4 className="font-medium text-sm">{badge.name}</h4>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                          <Badge 
                            variant="outline" 
                            className={`mt-2 text-xs ${
                              badge.rarity === 'legendary' ? 'border-yellow-400 text-yellow-700' :
                              badge.rarity === 'epic' ? 'border-purple-400 text-purple-700' :
                              badge.rarity === 'rare' ? 'border-blue-400 text-blue-700' :
                              'border-gray-400 text-gray-700'
                            }`}
                          >
                            {badge.rarity}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conquistas em Progresso */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Conquistas em Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.gamification.achievements.map((achievement) => (
                      <div key={achievement.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                          <Badge variant="outline">{achievement.points} pts</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{achievement.progress}/{achievement.target}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.target) * 100} 
                            className="h-2"
                          />
                          {achievement.isCompleted && (
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Conquista completada!
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dicas Motivacionais */}
              <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg text-green-800 dark:text-green-400">Dicas para Ganhar Mais Pontos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-3 bg-green-500/5 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-900/50">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">Pague em Dia</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">+5 pontos de bônus por pagamento pontual</p>
                      </div>
                      <div className="p-3 bg-green-500/5 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-900/50">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">Complete Parcelamentos</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">+50 pontos por cada parcelamento finalizado</p>
                      </div>
                      <div className="p-3 bg-green-500/5 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-900/50">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">Evite Atrasos</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">Mantenha sua sequência sem perdas de pontos</p>
                      </div>
                      <div className="p-3 bg-green-500/5 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-900/50">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">Organize-se</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">Use notificações para nunca esquecer</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
