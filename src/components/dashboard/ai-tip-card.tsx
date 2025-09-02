
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { getSpendingTip } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";
import { Transaction } from "@/lib/types";

interface AITipCardProps {
    transactions: Transaction[];
}

export function AITipCard({ transactions }: AITipCardProps) {
  const [tip, setTip] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchTip = useCallback(() => {
    if (transactions.length === 0) {
      setTip("Não há dados de transação suficientes para gerar uma dica.");
      return;
    }
    startTransition(async () => {
      setTip(""); // Clear previous tip
      const newTip = await getSpendingTip(transactions);
      setTip(newTip);
    });
  }, [transactions]);

  useEffect(() => {
    fetchTip();
  }, [fetchTip]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg text-primary/90">Dica Financeira com IA</CardTitle>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={fetchTip}
            disabled={isPending || transactions.length === 0}
            className="text-primary/70 hover:bg-primary/10 hover:text-primary rounded-full"
        >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isPending || (tip === "" && transactions.length > 0) ? (
           <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full bg-primary/10" />
            <Skeleton className="h-4 w-4/5 bg-primary/10" />
            <Skeleton className="h-4 w-1/2 bg-primary/10" />
          </div>
        ) : (
          <p className="text-foreground/90 pt-2 text-base">
            {tip}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
