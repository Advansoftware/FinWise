
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { getSpendingTip } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

interface AITipCardProps {
    transactions: Transaction[];
}

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

export function AITipCard({ transactions }: AITipCardProps) {
  const [tip, setTip] = useState("");
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  const fetchTip = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    if (transactions.length === 0 && !forceRefresh) {
      setTip("Adicione transações para receber sua primeira dica.");
      return;
    }

    startTransition(async () => {
        setTip(""); // Clear previous tip
        const { db } = getFirebase();
        const settingsRef = doc(db, "users", user.uid, "settings", "aiLastRan");
        
        try {
            const docSnap = await getDoc(settingsRef);
            const data = docSnap.data();
            const lastRun = data?.lastTipTimestamp?.toDate();
            const lastTip = data?.lastTipContent;

            if (lastRun && isSameDay(lastRun, new Date()) && !forceRefresh && lastTip) {
                setTip(lastTip);
            } else {
                const newTip = await getSpendingTip(transactions, user.uid, forceRefresh);
                setTip(newTip);
                // Only cache the content if it was a free, automatic generation
                if (!forceRefresh) {
                    await setDoc(settingsRef, {
                        lastTipTimestamp: Timestamp.now(),
                        lastTipContent: newTip
                    }, { merge: true });
                }
            }
        } catch (error: any) {
            console.error("Error fetching or setting spending tip:", error);
            setTip(error.message || "Não foi possível carregar a dica. Tente novamente.");
        }
    });
  }, [transactions, user]);

  useEffect(() => {
    if(user && transactions.length > 0) {
      fetchTip();
    } else if (transactions.length === 0) {
      setTip("Adicione transações para receber sua primeira dica.");
    }
  }, [transactions.length, user, fetchTip]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-lg text-primary/90">Dica Financeira com IA</CardTitle>
            </div>
            <CardDescription className="text-xs text-primary/70 mt-1">
                Gerado automaticamente 1x por dia. Atualizar custa 1 crédito.
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
