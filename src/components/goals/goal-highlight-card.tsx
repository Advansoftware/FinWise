// src/components/goals/goal-highlight-card.tsx
'use client';

import { useGoals } from "@/hooks/use-goals";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Target, PiggyBank } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { AddDepositDialog } from "./add-deposit-dialog";

export function GoalHighlightCard() {
    const { goals, isLoading } = useGoals();

    if (isLoading) {
        return <Skeleton className="h-[188px]"/>;
    }

    const firstGoal = goals.length > 0 ? goals[0] : null;

    if (!firstGoal) {
        return (
             <Card className="flex flex-col items-center justify-center text-center p-6">
                <PiggyBank className="h-10 w-10 text-primary/70 mb-2"/>
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

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                        <Target className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                         <CardTitle className="text-lg">{firstGoal.name}</CardTitle>
                         <p className="text-sm text-muted-foreground">Sua meta em destaque</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <Progress value={Math.min(percentage, 100)} />
                 <div className="flex justify-between items-baseline">
                    <p className="text-xl font-bold text-foreground">R$ {firstGoal.currentAmount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">de R$ {firstGoal.targetAmount.toFixed(2)}</p>
                </div>
            </CardContent>
             <CardFooter className="flex gap-2">
                 <Button asChild variant="outline" className="flex-1">
                    <Link href="/goals">Ver Todas</Link>
                 </Button>
                  <AddDepositDialog goal={firstGoal}>
                    <Button className="flex-1">
                        <PiggyBank className="mr-2 h-4 w-4"/>Depositar
                    </Button>
                </AddDepositDialog>
             </CardFooter>
        </Card>
    )
}
