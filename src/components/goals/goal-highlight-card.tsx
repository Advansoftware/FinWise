// src/components/goals/goal-highlight-card.tsx
'use client';

import { useGoals } from "@/hooks/use-goals";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Target, PiggyBank, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { AddDepositDialog } from "./add-deposit-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import { useState, useEffect, useTransition, useMemo } from "react";
import { getSmartGoalPrediction } from "@/services/ai-automation-service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ProjectGoalCompletionOutput } from "@/ai/ai-types";


export function GoalHighlightCard() {
    const { goals, isLoading: isGoalsLoading } = useGoals();
    const { allTransactions, isLoading: isTxLoading } = useTransactions();
    const { user } = useAuth();
    const [isProjecting, startProjecting] = useTransition();
    const [projectionResult, setProjectionResult] = useState<ProjectGoalCompletionOutput | null>(null);
    const [hasLoadedProjection, setHasLoadedProjection] = useState(false);

    const isLoading = isGoalsLoading || isTxLoading;

    const firstGoal = useMemo(() => {
        if (!goals || goals.length === 0) return null;
        // Prioritize the goal that is not yet completed
        return goals.find(g => g.currentAmount < g.targetAmount) || goals[0];
    }, [goals]);

    const transactionsJson = useMemo(() => JSON.stringify(allTransactions, null, 2), [allTransactions]);

    // Carrega projeção usando sistema inteligente
    useEffect(() => {
        if (user && firstGoal && firstGoal.currentAmount < firstGoal.targetAmount && !hasLoadedProjection) {
            startProjecting(async () => {
                 try {
                    const result = await getSmartGoalPrediction(firstGoal.id, {
                        goalName: firstGoal.name,
                        targetAmount: firstGoal.targetAmount,
                        currentAmount: firstGoal.currentAmount,
                        targetDate: firstGoal.targetDate,
                        monthlyDeposit: firstGoal.monthlyDeposit,
                        transactions: transactionsJson,
                    }, user.uid);
                    setProjectionResult(result);
                    setHasLoadedProjection(true);
                } catch (e) {
                    console.error("Projection error:", e);
                    setProjectionResult({ projection: "Erro ao calcular." });
                    setHasLoadedProjection(true);
                }
            });
        } else if (firstGoal && firstGoal.currentAmount >= firstGoal.targetAmount && !hasLoadedProjection) {
            setProjectionResult({ projection: "Meta concluída!" });
            setHasLoadedProjection(true);
        }
    }, [firstGoal, user, hasLoadedProjection, transactionsJson]);

    // Função para refresh manual da projeção
    const refreshProjection = () => {
        if (!user || !firstGoal) return;
        
        setHasLoadedProjection(false);
        startProjecting(async () => {
            try {
                const result = await getSmartGoalPrediction(firstGoal.id, {
                    goalName: firstGoal.name,
                    targetAmount: firstGoal.targetAmount,
                    currentAmount: firstGoal.currentAmount,
                    targetDate: firstGoal.targetDate,
                    monthlyDeposit: firstGoal.monthlyDeposit,
                    transactions: transactionsJson,
                }, user.uid, true); // forceRefresh = true
                setProjectionResult(result);
                setHasLoadedProjection(true);
            } catch (e) {
                console.error("Projection error:", e);
                setProjectionResult({ projection: "Erro ao calcular." });
                setHasLoadedProjection(true);
            }
        });
    };


    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <PiggyBank className="h-4 w-4" />
                        Metas
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!firstGoal) {
        return (
             <Card className="flex flex-col items-center justify-center text-center p-4">
                <Target className="h-8 w-8 text-primary/70 mb-2"/>
                <CardTitle className="text-base">Crie sua Primeira Meta</CardTitle>
                <CardContent className="p-0 mt-1 mb-3">
                    <p className="text-xs text-muted-foreground">Comece a economizar para seus sonhos.</p>
                </CardContent>
                <Button asChild size="sm">
                    <Link href="/goals">Criar Meta</Link>
                </Button>
            </Card>
        )
    }

    const percentage = Math.round((firstGoal.currentAmount / firstGoal.targetAmount) * 100);
    
    const getProjectionText = () => {
        if (!projectionResult) return null;
        if (projectionResult.projection === "Meta concluída!") {
            return <span className="text-emerald-500 font-semibold">{projectionResult.projection}</span>
        }
        if (projectionResult.completionDate) {
            const date = new Date(projectionResult.completionDate);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            return <span>Estimativa: <span className="font-semibold text-foreground/80 capitalize">{format(date, "MMMM 'de' yyyy", { locale: ptBR })}</span></span>
        }
        return <span className="capitalize">{projectionResult.projection}</span>
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-primary/20">
                        <Target className="h-3 w-3 text-primary"/>
                    </div>
                    <div className="min-w-0 flex-1">
                         <CardTitle className="text-sm truncate">{firstGoal.name}</CardTitle>
                         <CardDescription className="text-xs">Sua meta em destaque</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-3 flex-1">
                <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                 <div className="flex justify-between items-baseline">
                    <p className="text-base font-bold text-foreground">R$ {firstGoal.currentAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">de R$ {firstGoal.targetAmount.toFixed(2)}</p>
                </div>
                 <div className="text-xs text-muted-foreground flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                        <Sparkles className={cn("h-3 w-3 text-primary/80 flex-shrink-0", isProjecting && "animate-pulse")} />
                         <span className="truncate">
                         {isProjecting ? (
                            "Calculando..."
                        ) : (
                           getProjectionText()
                        )}
                         </span>
                    </div>
                    {projectionResult && !isProjecting && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-primary flex-shrink-0"
                            onClick={refreshProjection}
                            title="Atualizar previsão"
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </CardContent>
             <CardFooter className="flex gap-2 p-4 pt-0 flex-shrink-0">
                 <Button asChild variant="outline" className="flex-1" size="sm">
                    <Link href="/goals">Ver Todas</Link>
                 </Button>
                  <AddDepositDialog goal={firstGoal}>
                    <Button className="flex-1" size="sm" disabled={firstGoal.currentAmount >= firstGoal.targetAmount}>
                        <PiggyBank className="mr-1 h-3 w-3"/>Depositar
                    </Button>
                </AddDepositDialog>
             </CardFooter>
        </Card>
    )
}
