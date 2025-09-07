// src/components/dashboard/future-balance-card.tsx
'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { getSmartFutureBalance } from "@/services/ai-automation-service";
import { PredictFutureBalanceOutput } from "@/ai/ai-types";
import { subMonths, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/use-plan";

export function FutureBalanceCard() {
  const [prediction, setPrediction] = useState<PredictFutureBalanceOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { wallets } = useWallets();
  const { budgets } = useBudgets();
  const { allTransactions } = useTransactions();
  const { isPlus } = usePlan();

  const currentBalance = useMemo(() => wallets.reduce((sum, w) => sum + w.balance, 0), [wallets]);
  
  const fetchPrediction = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    if (allTransactions.length === 0 && !forceRefresh) {
      setPrediction({
        summary: "Adicione transações para gerar sua primeira previsão.",
        projectedEndOfMonthBalance: currentBalance,
        isRiskOfNegativeBalance: false,
      });
      return;
    }

    startTransition(async () => {
      setPrediction(null); // Clear previous prediction
      try {
          const last3MonthsStart = startOfMonth(subMonths(new Date(), 3));
          const last3MonthsTransactions = allTransactions.filter(t => new Date(t.date) >= last3MonthsStart);
          const recurringBills = budgets.map(b => ({ category: b.category, amount: b.amount }));

          const result = await getSmartFutureBalance({
            last3MonthsTransactions: JSON.stringify(last3MonthsTransactions),
            currentBalance: currentBalance,
            recurringBills: JSON.stringify(recurringBills),
          }, user.uid, forceRefresh);
          setPrediction(result);
      } catch (error: any) {
        console.error("Error fetching future balance prediction:", error);
        setPrediction({
          summary: error.message || "Não foi possível carregar a previsão. Tente novamente.",
          projectedEndOfMonthBalance: 0,
          isRiskOfNegativeBalance: true,
        });
      }
    });
  }, [allTransactions, user, budgets, currentBalance]);

  useEffect(() => {
    if(user && isPlus && allTransactions.length > 0) {
        fetchPrediction();
    }
  }, [allTransactions.length, user, isPlus, fetchPrediction]);

  const renderContent = () => {
    if (isPending || !prediction) {
      return (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-8 w-2/5 bg-primary/10" />
          <Skeleton className="h-4 w-4/5 bg-primary/10" />
        </div>
      );
    }
    
    return (
        <>
            <p className={cn("text-3xl font-bold tracking-tight", prediction.isRiskOfNegativeBalance ? "text-destructive" : "text-foreground")}>
              R$ {prediction.projectedEndOfMonthBalance.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {prediction.summary}
            </p>
        </>
    );
  };
  
  if (!isPlus) return null;

  return (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border-primary/20">
       <CardHeader className="pb-3 p-4">
          <div className="flex items-start justify-between">
             <div className="flex-1">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-full", prediction?.isRiskOfNegativeBalance ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary")}>
                        {prediction?.isRiskOfNegativeBalance ? <AlertTriangle className="h-4 w-4"/> : <TrendingUp className="h-4 w-4"/>}
                    </div>
                    <div>
                        <CardTitle className="text-sm">Previsão de Saldo</CardTitle>
                        <CardDescription className="text-xs">Projeção para o fim deste mês</CardDescription>
                    </div>
                </div>
                 <CardDescription className="text-xs text-primary/70 mt-1 pl-8">
                    Gerado 1x por mês. Atualizar custa 5 créditos da Gastometria AI.
                </CardDescription>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchPrediction(true)}
                disabled={isPending || !user}
                className="text-primary/70 hover:bg-primary/10 hover:text-primary rounded-full h-7 w-7 -mt-1"
            >
                <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
         {renderContent()}
      </CardContent>
    </Card>
  );
}
