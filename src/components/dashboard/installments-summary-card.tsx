'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

  // Verificar se o usuário tem acesso (plano Pro ou superior)
  const hasAccess = plan && ['Pro', 'Plus', 'Infinity'].includes(plan);

  if (!hasAccess) {
    return (
      <Card className="overflow-hidden border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Parcelamentos
            </CardTitle>
            <Badge variant="outline" className="text-xs">Pro+</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Gerencie suas compras parceladas com gamificação e controle total.
          </p>
          <Link href="/billing" passHref>
            <Button size="sm" className="w-full">
              Fazer Upgrade <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Parcelamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalActiveInstallments === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Parcelamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Nenhum parcelamento ativo no momento.
          </p>
          <Link href="/installments" passHref>
            <Button size="sm" className="w-full">
              Criar Parcelamento <ChevronRight className="h-4 w-4 ml-1" />
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
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Parcelamentos
          </CardTitle>
          <div className="flex items-center gap-2">
            {gamification.streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-orange-500"
              >
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium">{gamification.streak}</span>
              </motion.div>
            )}
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Nível {gamification.level.level}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        {/* Status Geral */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold">{summary.totalActiveInstallments}</div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(summary.totalMonthlyCommitment)}</div>
            <div className="text-xs text-muted-foreground">Mensal</div>
          </div>
        </div>

        {/* Progresso do Nível */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Progresso do Nível</span>
            <span className="text-xs text-muted-foreground">
              {gamification.points}/{gamification.level.pointsRequired + gamification.level.pointsToNext} pts
            </span>
          </div>
          <Progress 
            value={(gamification.points / (gamification.level.pointsRequired + gamification.level.pointsToNext)) * 100} 
            className="h-2"
          />
        </div>

        {/* Alertas importantes */}
        {overdueCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                {overdueCount} parcela{overdueCount > 1 ? 's' : ''} em atraso
              </span>
            </div>
            
            {/* Mostrar as parcelas em atraso mais urgentes */}
            {summary.overduePayments.slice(0, 1).map((payment) => {
              const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={payment.id} className="flex items-center justify-between text-xs">
                  <span className="text-red-600 dark:text-red-400 truncate">
                    Parcela {payment.installmentNumber} • {daysOverdue} dias
                  </span>
                  <span className="font-medium text-red-700 dark:text-red-400 flex-shrink-0 ml-2">
                    {formatCurrency(payment.scheduledAmount)}
                  </span>
                </div>
              );
            })}
            
            {summary.overduePayments.length > 1 && (
              <div className="text-xs text-red-600 dark:text-red-400 pt-1 border-t border-red-200 dark:border-red-900/50">
                E mais {summary.overduePayments.length - 1} parcela{summary.overduePayments.length - 1 > 1 ? 's' : ''} em atraso
              </div>
            )}
          </motion.div>
        )}

        {/* Próximos Pagamentos - mais compacto */}
        {nextPayments.length > 0 && !overdueCount && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Próximos pagamentos
            </div>
            {nextPayments.slice(0, 2).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    Parcela {payment.installmentNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(payment.dueDate).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </div>
                </div>
                <div className="text-xs font-medium flex-shrink-0 ml-2">
                  {formatCurrency(payment.scheduledAmount)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badges recentes - mais compacto */}
        {gamification.badges.length > 0 && (
          <div className="flex items-center gap-1">
            {gamification.badges.slice(0, 3).map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0"
                title={badge.name}
              >
                <Star className="h-3 w-3 text-white" />
              </motion.div>
            ))}
            {gamification.badges.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{gamification.badges.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Botão de ação */}
      <CardContent className="pt-0 pb-4 flex-shrink-0">
        <Link href="/installments" passHref>
          <Button size="sm" variant="outline" className="w-full">
            Ver Detalhes <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
