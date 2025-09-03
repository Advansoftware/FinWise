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

    const isLoading = isGoalsLoading || isTxLoading;

    const firstGoal = useMemo(() => {
        if (!goals || goals.length === 0) return null;
        // Prioritize the goal that is not yet completed
        return goals.find(g => g.currentAmount < g.targetAmount) || goals[0];
    }, [goals]);

    const transactionsJson = useMemo(() => JSON.stringify(allTransactions, null, 2), [allTransactions]);

    useEffect(() => {
        if (user && allTransactions.length > 0 && firstGoal && firstGoal.currentAmount < firstGoal.targetAmount) {
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
                } catch (e) {
                    console.error("Projection error:", e);
                    setProjectionResult({ projection: "Erro ao calcular." });
                }
            });
        } else if (firstGoal && firstGoal.currentAmount >= firstGoal.targetAmount) {
            setProjectionResult({ projection: "Meta concluída!" });
        }
    }, [firstGoal, user, allTransactions.length, transactionsJson]);


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
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                        <Target className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                         <CardTitle className="text-lg">{firstGoal.name}</CardTitle>
                         <CardDescription>Sua meta em destaque</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <Progress value={Math.min(percentage, 100)} />
                 <div className="flex justify-between items-baseline">
                    <p className="text-xl font-bold text-foreground">R$ {firstGoal.currentAmount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">de R$ {firstGoal.targetAmount.toFixed(2)}</p>
                </div>
                 <div className="text-xs text-muted-foreground h-4 flex items-center gap-2">
                    <Sparkles className={cn("h-3.5 w-3.5 text-primary/80", isProjecting && "animate-pulse")} />
                     {isProjecting ? (
                        <span>Calculando projeção...</span>
                    ) : (
                       getProjectionText()
                    )}
                </div>
            </CardContent>
             <CardFooter className="flex gap-2">
                 <Button asChild variant="outline" className="flex-1">
                    <Link href="/goals">Ver Todas</Link>
                 </Button>
                  <AddDepositDialog goal={firstGoal}>
                    <Button className="flex-1" disabled={firstGoal.currentAmount >= firstGoal.targetAmount}>
                        <PiggyBank className="mr-2 h-4 w-4"/>Depositar
                    </Button>
                </AddDepositDialog>
             </CardFooter>
        </Card>
    )
}
