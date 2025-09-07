// src/components/dashboard/ai-tip-card.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { getSmartSpendingTip } from "@/services/ai-automation-service";
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
  const { user } = useAuth();
  const { isPro } = usePlan();

  const fetchTip = useCallback(async (forceRefresh = false) => {
    if (!user) return;
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
  }, [transactions, user]);

  // Carrega apenas uma vez quando o componente monta
  useEffect(() => {
    if(user && isPro && transactions.length > 0 && !hasLoaded) {
      fetchTip(false); // Sempre false para não consumir créditos no carregamento inicial
    } else if (transactions.length === 0 && !hasLoaded) {
      setTip("Adicione transações para receber sua primeira dica.");
      setHasLoaded(true);
    }
  }, [user, isPro, hasLoaded]); // Removido transactions.length das dependências

  if (!isPro) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="flex flex-row items-start justify-between pb-2 p-4">
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <CardTitle className="text-sm text-primary/90">Dica Financeira com IA</CardTitle>
            </div>
            <CardDescription className="text-xs text-primary/70 mt-1">
                Dados salvos no banco. Atualizar manualmente custa 1 crédito.
            </CardDescription>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchTip(true)}
            disabled={isPending || !user}
            className="text-primary/70 hover:bg-primary/10 hover:text-primary rounded-full h-7 w-7"
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
          <p className="text-foreground/90 text-sm">
            {tip}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
