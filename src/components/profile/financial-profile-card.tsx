
"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { useReports } from "@/hooks/use-reports";
import { getFinancialProfile } from "@/app/actions";
import { Separator } from "../ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { startOfMonth, getYear, isSameMonth } from "date-fns";

export function FinancialProfileCard() {
  const [profile, setProfile] = useState("");
  const [isPending, startTransition] = useTransition();
  const { allTransactions } = useTransactions();
  const { monthlyReports, annualReports } = useReports();
  const { user } = useAuth();

  const currentMonthTransactions = useMemo(() => {
    const startOfCurrentMonth = startOfMonth(new Date());
    return allTransactions.filter(t => new Date(t.date) >= startOfCurrentMonth);
  }, [allTransactions]);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    if (allTransactions.length === 0) {
      setProfile("Adicione transações para gerar seu primeiro perfil financeiro.");
      return;
    }

    startTransition(async () => {
      setProfile(""); // Clear previous profile
      const { db } = getFirebase();
      const settingsRef = doc(db, "users", user.uid, "settings", "aiLastRan");

      try {
        const docSnap = await getDoc(settingsRef);
        const data = docSnap.data();
        const lastRun = data?.lastProfileTimestamp?.toDate();
        const lastProfile = data?.lastProfileContent;

        if (lastRun && isSameMonth(lastRun, new Date()) && !forceRefresh && lastProfile) {
          setProfile(lastProfile);
        } else {
           const currentYear = getYear(new Date());
           const currentYearMonthlyReports = monthlyReports.filter(r => r.year === currentYear);
           const pastAnnualReports = annualReports.filter(r => r.year < currentYear);

          const newProfile = await getFinancialProfile({
            monthlyReports: JSON.stringify(currentYearMonthlyReports, null, 2),
            annualReports: JSON.stringify(pastAnnualReports, null, 2),
            currentMonthTransactions: JSON.stringify(currentMonthTransactions, null, 2),
          }, user.uid, forceRefresh);

          setProfile(newProfile);
          await setDoc(settingsRef, {
            lastProfileTimestamp: Timestamp.now(),
            lastProfileContent: newProfile
          }, { merge: true });
        }
      } catch (error) {
        console.error("Error fetching or setting financial profile:", error);
        setProfile("Não foi possível carregar o perfil. Tente novamente.");
      }
    });
  }, [allTransactions, monthlyReports, annualReports, currentMonthTransactions, user]);

  useEffect(() => {
    if(user && allTransactions.length > 0) {
        fetchProfile();
    } else if (allTransactions.length === 0) {
        setProfile("Adicione transações para gerar seu primeiro perfil financeiro.");
    }
  }, [allTransactions.length, user, fetchProfile]);

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
                onClick={() => fetchProfile(true)}
                disabled={isPending || allTransactions.length === 0 || !user}
                className="text-primary/70 hover:bg-primary/10 hover:text-primary rounded-full h-8 w-8"
            >
                <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
        </div>
        <CardDescription>Uma análise gerada por IA sobre seus hábitos de consumo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        {isPending ? (
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
