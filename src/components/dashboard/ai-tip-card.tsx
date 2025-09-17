// src/components/dashboard/ai-tip-card.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { getSmartSpendingTip } from "@/services/ai-automation-service";
import { validateDataSufficiency } from "@/services/ai-cache-service";
import { Skeleton } from "../ui/skeleton";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";

interface AITipCardProps {
    transactions: Transaction[];
}

export function AITipCard({ transactions }: AITipCardProps) {
  const [tip, setTip] = useState("");
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { user } = useAuth();
  const { isPro } = usePlan();

  // Valida dados quando transações mudam
  useEffect(() => {
    if (user && transactions) {
      validateDataSufficiency(user.uid, 'spending_tip', transactions).then(setValidationResult);
    }
  }, [user, transactions]);

  const fetchTip = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Se não tem dados suficientes e não está forçando, mostra mensagem
    if (!forceRefresh && validationResult && !validationResult.isValid) {
      setTip(validationResult.message);
      setHasLoaded(true);
      return;
    }

    // Se não tem transações e não está forçando
    if (transactions.length === 0 && !forceRefresh) {
      setTip("Adicione transações para receber sua primeira dica.");
      setHasLoaded(true);
      return;
    }

    startTransition(async () => {
        if (forceRefresh) setTip(""); // Clear previous tip only on refresh
        try {
            const newTip = await getSmartSpendingTip(transactions, user.uid, forceRefresh);
            setTip(newTip);
            setHasLoaded(true);
        } catch (error: any) {
            console.error("Error fetching or setting spending tip:", error);
            setTip(error.message || "Não foi possível carregar a dica. Tente novamente.");
            setHasLoaded(true);
        }
    });
  }, [transactions, user, validationResult]);

  // Carrega automaticamente quando há dados suficientes
  useEffect(() => {
    if (user && isPro && !hasLoaded && validationResult?.isValid) {
      fetchTip(false); // Sempre false para não consumir créditos no carregamento inicial
    } else if (!hasLoaded && validationResult && !validationResult.isValid) {
      setTip(validationResult.message);
      setHasLoaded(true);
    }
  }, [user, isPro, hasLoaded, validationResult, fetchTip]);

  if (!isPro) return null;

  const showInsufficientData = validationResult && !validationResult.isValid;

  return (
    <Card className={`bg-card/50 backdrop-blur-sm ${showInsufficientData ? 'border-amber-500/20' : 'border-primary/20'}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 p-4">
        <div className="flex-1">
            <div className="flex items-center gap-2">
                {showInsufficientData ? (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                )}
                <CardTitle className={`text-sm ${showInsufficientData ? 'text-amber-500' : 'text-primary/90'}`}>
                  Dica Financeira com IA
                </CardTitle>
            </div>
            <CardDescription className={`text-xs mt-1 ${showInsufficientData ? 'text-amber-500/70' : 'text-primary/70'}`}>
                {showInsufficientData 
                  ? `Precisa de ${validationResult?.requiredMinimum || 0} transações (você tem ${validationResult?.currentCount || 0})`
                  : "Cache mensal renovado automaticamente. Atualizar custa 1 crédito."
                }
            </CardDescription>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchTip(true)}
            disabled={isPending || !user}
            className="text-primary/70 hover:bg-primary/10 hover:text-primary rounded-full h-7 w-7"
            title={showInsufficientData ? "Forçar geração (pode consumir crédito)" : "Atualizar dica (1 crédito)"}
        >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isPending ? (
           <div className="space-y-2">
            <Skeleton className="h-3 w-full bg-primary/10" />
            <Skeleton className="h-3 w-4/5 bg-primary/10" />
          </div>
        ) : (
          <p className={`text-sm ${showInsufficientData ? 'text-amber-600 dark:text-amber-400' : 'text-foreground/90'}`}>
            {tip}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
