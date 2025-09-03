// src/app/(app)/goals/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Trash2, Edit, Target, PiggyBank, CircleDollarSign, Sparkles, Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/use-goals";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { AddDepositDialog } from "@/components/goals/add-deposit-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Goal } from "@/lib/types";
import { useState, useTransition, useEffect, useMemo, useRef } from "react";
import { projectGoalCompletionAction } from "@/app/actions";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProjectGoalCompletionOutput } from "@/ai/ai-types";
import { GoalCompletionCelebration } from "@/components/goals/goal-celebration";

export default function GoalsPage() {
    const { goals, isLoading, deleteGoal } = useGoals();
    const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
    const prevGoalsRef = useRef<Goal[]>([]);

    useEffect(() => {
        // Find a goal that just got completed
        const justCompleted = goals.find(currentGoal => {
            const prevGoal = prevGoalsRef.current.find(pg => pg.id === currentGoal.id);
            // It's completed now, but it wasn't before
            return currentGoal.currentAmount >= currentGoal.targetAmount && prevGoal && prevGoal.currentAmount < prevGoal.targetAmount;
        });

        if (justCompleted) {
            setCompletedGoal(justCompleted);
        }

        // Update the previous goals ref for the next render
        prevGoalsRef.current = goals;
    }, [goals]);
    
    if (isLoading) {
        return <GoalsSkeleton />
    }
    
    return (
        <>
            {completedGoal && <GoalCompletionCelebration goal={completedGoal} onComplete={() => setCompletedGoal(null)} />}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Metas de Economia</h1>
                        <p className="text-muted-foreground">Transforme seus sonhos em realidade. Crie metas financeiras e acompanhe seu progresso a cada depósito.</p>
                    </div>
                     <CreateGoalDialog>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Nova Meta
                        </Button>
                    </CreateGoalDialog>
                </div>
                
                {goals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map(goal => (
                           <GoalCard key={goal.id} goal={goal} onDelete={() => deleteGoal(goal.id)} />
                        ))}
                    </div>
                ) : (
                     <Card className="col-span-full">
                        <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                            <PiggyBank className="mx-auto h-12 w-12 mb-4 text-primary/50"/>
                           <h3 className="text-lg font-semibold text-foreground">Nenhuma meta encontrada.</h3>
                           <p className="text-sm max-w-md mx-auto">Crie sua primeira meta para começar a economizar. Que tal "Viagem de Férias" ou "Entrada do Apartamento"?</p>
                             <CreateGoalDialog>
                                <Button className="mt-4">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Criar Meta
                                </Button>
                            </CreateGoalDialog>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}

function GoalCard({ goal, onDelete }: { goal: Goal, onDelete: () => void }) {
    const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    const { user } = useAuth();
    const { allTransactions } = useTransactions();
    const [isProjecting, startProjecting] = useTransition();
    const [projectionResult, setProjectionResult] = useState<ProjectGoalCompletionOutput | null>(null);

    const transactionsJson = useMemo(() => JSON.stringify(allTransactions, null, 2), [allTransactions]);

    useEffect(() => {
        if (user && allTransactions.length > 0 && goal.currentAmount < goal.targetAmount) {
            startProjecting(async () => {
                try {
                    const result = await projectGoalCompletionAction({
                        goalName: goal.name,
                        targetAmount: goal.targetAmount,
                        currentAmount: goal.currentAmount,
                        monthlyDeposit: goal.monthlyDeposit,
                        targetDate: goal.targetDate,
                        transactions: transactionsJson,
                    }, user.uid);
                    setProjectionResult(result);
                } catch (e) {
                    console.error("Projection error:", e);
                    setProjectionResult({ projection: "Erro ao calcular projeção." });
                }
            });
        } else if (goal.currentAmount >= goal.targetAmount) {
            setProjectionResult({ projection: "Meta concluída!" });
        }
    }, [goal, user]);

    const getProjectionText = () => {
        if (!projectionResult) return null;
        if (projectionResult.projection === "Meta concluída!") {
            return <span className="text-emerald-500 font-semibold">{projectionResult.projection}</span>
        }
        if (projectionResult.completionDate) {
            const date = new Date(projectionResult.completionDate);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            return <span>Estimativa de conclusão: <span className="font-semibold text-foreground/80 capitalize">{format(date, "MMMM 'de' yyyy", { locale: ptBR })}</span></span>
        }
        return <span className="capitalize">{projectionResult.projection}</span>
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-full bg-primary/20"><Target className="h-6 w-6 text-primary"/></div>
                         <CardTitle>{goal.name}</CardTitle>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <AddDepositDialog goal={goal}>
                                <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                    <CircleDollarSign className="mr-2 h-4 w-4"/>Adicionar Depósito
                                </div>
                            </AddDepositDialog>
                            <CreateGoalDialog initialData={goal}>
                                <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                    <Edit className="mr-2 h-4 w-4"/>Editar Meta
                                </div>
                            </CreateGoalDialog>
                           
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-400 focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4"/>Excluir Meta
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a meta "{goal.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                     <Progress value={Math.min(percentage, 100)} />
                </div>
                <div className="flex justify-between items-baseline">
                    <p className="text-lg font-bold text-foreground">R$ {goal.currentAmount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">de R$ {goal.targetAmount.toFixed(2)}</p>
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
             <CardFooter>
                 <AddDepositDialog goal={goal}>
                    <Button className="w-full" disabled={goal.currentAmount >= goal.targetAmount}>
                        <PiggyBank className="mr-2 h-4 w-4"/>Fazer um Depósito
                    </Button>
                </AddDepositDialog>
             </CardFooter>
        </Card>
    );
}

function GoalsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    )
}
