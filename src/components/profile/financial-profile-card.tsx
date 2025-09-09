// src/components/profile/financial-profile-card.tsx
"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, Trophy, Award, Target, Zap } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { useReports } from "@/hooks/use-reports";
import { useGamification } from "@/hooks/use-gamification";
import { getSmartFinancialProfile } from "@/services/ai-automation-service";
import { Separator } from "../ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { startOfMonth, getYear } from "date-fns";
import { FinancialProfileOutput } from "@/ai/ai-types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function FinancialProfileCard() {
  const [profile, setProfile] = useState<FinancialProfileOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { allTransactions } = useTransactions();
  const { monthlyReports, annualReports } = useReports();
  const { gamificationData, profileInsights } = useGamification();
  const { user } = useAuth();

  const currentMonthTransactions = useMemo(() => {
    const startOfCurrentMonth = startOfMonth(new Date());
    return allTransactions.filter(t => new Date(t.date) >= startOfCurrentMonth);
  }, [allTransactions]);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    if (allTransactions.length === 0 && !forceRefresh) {
      setProfile({ profileName: "Aguardando Dados", profileDescription: "Adicione transações para gerar seu primeiro perfil financeiro."});
      return;
    }

    startTransition(async () => {
      setProfile(null); // Clear previous profile
      try {
           const currentYear = getYear(new Date());
           const currentYearMonthlyReports = monthlyReports.filter(r => r.period.startsWith(currentYear.toString()));
           const pastAnnualReports = annualReports.filter(r => parseInt(r.period) < currentYear);

          const newProfile = await getSmartFinancialProfile({
            monthlyReports: JSON.stringify(currentYearMonthlyReports, null, 2),
            annualReports: JSON.stringify(pastAnnualReports, null, 2),
            currentMonthTransactions: JSON.stringify(currentMonthTransactions, null, 2),
            gamificationData: gamificationData ? JSON.stringify(gamificationData, null, 2) : undefined
          }, user.uid, forceRefresh);

          setProfile(newProfile);
        
      } catch (error: any) {
        console.error("Error fetching or setting financial profile:", error);
        setProfile({ profileName: "Erro", profileDescription: error.message || "Não foi possível carregar o perfil. Tente novamente."});
      }
    });
  }, [allTransactions, monthlyReports, annualReports, currentMonthTransactions, user, gamificationData]);

  useEffect(() => {
    if(user && allTransactions.length > 0) {
        fetchProfile();
    } else if (allTransactions.length === 0) {
        setProfile({ profileName: "Aguardando Dados", profileDescription: "Adicione transações para gerar seu primeiro perfil."});
    }
  }, [allTransactions.length, user]);

  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
             <div className="flex-1">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg text-primary/90">Seu Perfil Financeiro</CardTitle>
                </div>
                 <CardDescription className="text-xs text-primary/70 mt-1">
                    Gerado 1x por mês. Atualizar custa 5 créditos.
                </CardDescription>
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
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        {isPending || !profile ? (
           <div className="space-y-3 pt-2">
            <Skeleton className="h-5 w-3/5 bg-primary/10" />
            <Skeleton className="h-4 w-full bg-primary/10" />
            <Skeleton className="h-4 w-full bg-primary/10" />
            <Skeleton className="h-4 w-4/5 bg-primary/10" />
          </div>
        ) : (
          <div className="pt-2 space-y-4">
            <div>
              <h4 className="font-bold text-xl text-foreground">{profile.profileName}</h4>
              <p className="text-foreground/90 mt-2 text-sm whitespace-pre-line">
                {profile.profileDescription}
              </p>
            </div>

            {/* Seção de Gamificação */}
            {profile.gamificationInfluence && profileInsights && (
              <div className="space-y-3">
                <Separator className="my-3" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Trophy className="h-4 w-4" />
                    Perfil Gamificado
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground">Disciplina</div>
                      <Badge variant="outline" className="mt-1">
                        {profile.gamificationInfluence.disciplineLevel}
                      </Badge>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground">Consistência</div>
                      <Badge variant="outline" className="mt-1">
                        {profile.gamificationInfluence.paymentConsistency}
                      </Badge>
                    </div>
                  </div>

                  {profileInsights.financialMaturity > 0 && (
                    <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Maturidade Financeira</span>
                        <span className="font-medium">{profileInsights.financialMaturity}%</span>
                      </div>
                      <Progress value={profileInsights.financialMaturity} className="h-2" />
                    </div>
                  )}

                  {profile.gamificationInfluence.strengthsFromGamification && 
                   profile.gamificationInfluence.strengthsFromGamification.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                        <Award className="h-3 w-3" />
                        Pontos Fortes
                      </div>
                      {profile.gamificationInfluence.strengthsFromGamification.slice(0, 2).map((strength, index) => (
                        <div key={index} className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          • {strength}
                        </div>
                      ))}
                    </div>
                  )}

                  {profileInsights.motivationalTip && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-lg">
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                          {profileInsights.motivationalTip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
