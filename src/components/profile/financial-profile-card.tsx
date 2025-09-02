
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { getFinancialProfile } from "@/app/actions";
import { Separator } from "../ui/separator";

export function FinancialProfileCard() {
  const [profile, setProfile] = useState("");
  const [isPending, startTransition] = useTransition();
  const { allTransactions } = useTransactions();

  const fetchProfile = useCallback(() => {
    if (allTransactions.length === 0) {
      setProfile("Não há dados de transação suficientes para gerar seu perfil.");
      return;
    }
    startTransition(async () => {
      setProfile(""); // Clear previous profile
      const newProfile = await getFinancialProfile(allTransactions);
      setProfile(newProfile);
    });
  }, [allTransactions]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
             <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-primary/90">Seu Perfil Financeiro</CardTitle>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={fetchProfile}
                disabled={isPending || allTransactions.length === 0}
                className="text-primary/70 hover:bg-primary/10 hover:text-primary rounded-full h-8 w-8"
            >
                <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
        </div>
        <CardDescription>Uma análise gerada por IA sobre seus hábitos de consumo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        {isPending || (profile === "" && allTransactions.length > 0) ? (
           <div className="space-y-3 pt-2">
            <Skeleton className="h-5 w-3/5 bg-primary/10" />
            <Skeleton className="h-4 w-full bg-primary/10" />
            <Skeleton className="h-4 w-full bg-primary/10" />
            <Skeleton className="h-4 w-4/5 bg-primary/10" />
          </div>
        ) : (
          <p className="text-foreground/90 pt-2 text-sm whitespace-pre-line">
            {profile}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

    