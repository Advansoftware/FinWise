// src/components/dashboard/ai-tip-card.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { getSpendingTip } from "@/services/ai-actions";
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
  const { user } = useAuth();
  const { isPro } = usePlan();

  const fetchTip = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    if (transactions.length === 0 && !forceRefresh) {
      setTip("Adicione transações para receber sua primeira dica.");
      return;
    }

    startTransition(async () => {
        setTip(""); // Clear previous tip
        try {
            const newTip = await getSpendingTip(transactions, user.uid, forceRefresh);
            setTip(newTip);
        } catch (error: any) {
            console.error("Error fetching or setting spending tip:", error);
            setTip(error.message || "Não foi possível carregar a dica. Tente novamente.");
        }
    });
  }, [transactions, user]);

  useEffect(() => {
    if(user && isPro && transactions.length > 0) {
      fetchTip();
    } else if (transactions.length === 0) {
      setTip("Adicione transações para receber sua primeira dica.");
    }
  }, [transactions.length, user, isPro, fetchTip]);

  if (!isPro) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-lg text-primary/90">Dica Financeira com IA</CardTitle>
            </div>
            <CardDescription className="text-xs text-primary/70 mt-1">
                Gerado automaticamente 1x por dia. Atualizar custa 1 crédito da FinWise AI.
            </CardDescription>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchTip(true)}
            disabled={isPending || !user}
            className="text-primary/70 hover:bg-primary/10 hover:text-primary rounded-full"
        >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
           <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full bg-primary/10" />
            <Skeleton className="h-4 w-4/5 bg-primary/10" />
          </div>
        ) : (
          <p className="text-foreground/90 pt-2 text-sm">
            {tip}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
