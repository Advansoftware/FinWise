// src/app/(app)/goals/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Trash2, Edit, Target, PiggyBank, CircleDollarSign } from "lucide-react";
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

export default function GoalsPage() {
    const { goals, isLoading, deleteGoal } = useGoals();
    
    if (isLoading) {
        return <GoalsSkeleton />
    }
    
    return (
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
    )
}

function GoalCard({ goal, onDelete }: { goal: Goal, onDelete: () => void }) {
    const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    
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
            </CardContent>
             <CardFooter>
                 <AddDepositDialog goal={goal}>
                    <Button className="w-full">
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
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
            </div>
        </div>
    )
}
