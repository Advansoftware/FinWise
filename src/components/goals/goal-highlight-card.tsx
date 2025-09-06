// src/components/goals/goal-highlight-card.tsx
'use client';

import { useGoals } from "@/hooks/use-goals";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Target, PiggyBank, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { AddDepositDialog } from "./add-deposit-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import { useState, useEffect, useTransition, useMemo } from "react";
import { projectGoalCompletionAction } from "@/services/ai-actions";
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

    // Carrega projeção apenas uma vez
    useEffect(() => {
        if (user && allTransactions.length > 0 && firstGoal && firstGoal.currentAmount < firstGoal.targetAmount && !hasLoadedProjection) {
            startProjecting(async () => {
                 try {
                    const result = await projectGoalCompletionAction({
                        goalName: firstGoal.name,
                        targetAmount: firstGoal.targetAmount,
                        currentAmount: firstGoal.currentAmount,
                        monthlyDeposit: firstGoal.monthlyDeposit,
                        targetDate: firstGoal.targetDate,
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
    }, [firstGoal, user, hasLoadedProjection]); // Removido dependências que causavam re-renders


    if (isLoading) {
        return <Skeleton className="h-full"/>;
    }

    if (!firstGoal) {
        return (
             <Card className="flex flex-col items-center justify-center text-center p-6 h-full">
                <Target className="h-10 w-10 text-primary/70 mb-2"/>
                <CardTitle className="text-lg">Crie sua Primeira Meta</CardTitle>
                <CardContent className="p-0 mt-2 mb-4">
                    <p className="text-sm text-muted-foreground">Comece a economizar para seus sonhos.</p>
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
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/20">
                        <Target className="h-4 w-4 text-primary"/>
                    </div>
                    <div>
                         <CardTitle className="text-base">{firstGoal.name}</CardTitle>
                         <CardDescription className="text-xs">Sua meta em destaque</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 pb-3">
                <Progress value={Math.min(percentage, 100)} className="h-2" />
                 <div className="flex justify-between items-baseline">
                    <p className="text-lg font-bold text-foreground">R$ {firstGoal.currentAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">de R$ {firstGoal.targetAmount.toFixed(2)}</p>
                </div>
                 <div className="text-xs text-muted-foreground h-3 flex items-center gap-1">
                    <Sparkles className={cn("h-3 w-3 text-primary/80", isProjecting && "animate-pulse")} />
                     {isProjecting ? (
                        <span>Calculando...</span>
                    ) : (
                       getProjectionText()
                    )}
                </div>
            </CardContent>
             <CardFooter className="flex gap-2 pt-2">
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
