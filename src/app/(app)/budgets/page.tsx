// src/app/(app)/budgets/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Trash2, Edit, PiggyBank, Sparkles, Trophy, CheckCircle, Flame, Award } from "lucide-react";
import { useBudgets } from "@/hooks/use-budgets";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreateBudgetDialog } from "@/components/budgets/create-budget-dialog";
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
import { Budget } from "@/lib/types";
import { AutomaticBudgetCard } from "@/components/budgets/automatic-budget-card";
import { usePlan } from "@/hooks/use-plan";
import { useGamification } from "@/hooks/use-gamification";
import { formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
    const { budgets, isLoading, deleteBudget } = useBudgets();
    const { isPlus } = usePlan();
    const { gamificationData } = useGamification();
    
    if (isLoading) {
        return <BudgetsSkeleton />
    }
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
                    <p className="text-muted-foreground">Defina limites de gastos mensais para suas categorias e evite surpresas no final do mês. Acompanhar um orçamento é o primeiro passo para assumir o controle total de suas finanças.</p>
                </div>
                 <CreateBudgetDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
                    </Button>
                </CreateBudgetDialog>
            </div>
            
            {/* Gamification Summary for Budgets */}
            {gamificationData && (
                 <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-blue-800 dark:text-blue-300">
                            <Trophy className="h-5 w-5"/>
                            Desempenho dos Orçamentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-2xl font-bold">{budgets.length}</p>
                            <p className="text-xs text-muted-foreground">Orçamentos Ativos</p>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                                {gamificationData.achievements.find(a => a.id === 'budget-master')?.progress || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Orçamentos Cumpridos</p>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-2xl font-bold text-red-500">
                                 {gamificationData.achievements.find(a => a.id === 'overspending-avoider')?.progress || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Orçamentos Estourados</p>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
                                <Flame className="h-5 w-5"/> {gamificationData.streak || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Meses no Controle</p>
                        </div>
                    </CardContent>
                </Card>
            )}


            {isPlus && <AutomaticBudgetCard />}
            
            {budgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map(budget => (
                       <BudgetCard key={budget.id} budget={budget} onDelete={() => deleteBudget(budget.id)} />
                    ))}
                </div>
            ) : (
                 <Card className="col-span-full border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                       <PiggyBank className="h-12 w-12 mb-4 text-primary/50" />
                        <h3 className="text-lg font-semibold text-foreground">Nenhum orçamento encontrado.</h3>
                       <p className="text-sm max-w-md mx-auto">Crie seu primeiro orçamento para começar a planejar. Que tal definir um limite para "Supermercado" ou "Restaurante"?</p>
                        <CreateBudgetDialog>
                            <Button className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" /> Criar Orçamento
                            </Button>
                        </CreateBudgetDialog>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function BudgetCard({ budget, onDelete }: { budget: Budget, onDelete: () => void }) {
    const percentage = Math.round((budget.currentSpending / budget.amount) * 100);
    const progressColor = percentage > 100 ? "bg-red-600" : percentage > 80 ? "bg-yellow-500" : "bg-primary";
    const remainingAmount = budget.amount - budget.currentSpending;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                         <CardTitle className="flex items-center gap-2">
                             {budget.currentSpending <= budget.amount && <Award className="h-4 w-4 text-yellow-500" />}
                            {budget.name}
                         </CardTitle>
                        <CardDescription>Categoria: {budget.category}</CardDescription>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <CreateBudgetDialog initialData={budget}>
                                <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                    <Edit className="mr-2 h-4 w-4"/>Editar
                                </div>
                            </CreateBudgetDialog>
                           
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-400 focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4"/>Excluir Orçamento
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o orçamento "{budget.name}".
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
                     <Progress value={Math.min(percentage, 100)} indicatorClassName={cn(progressColor)} />
                </div>
                <div className="flex justify-between items-baseline">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(budget.currentSpending)}</p>
                    <p className="text-sm text-muted-foreground">de {formatCurrency(budget.amount)}</p>
                </div>
                 <div className="text-right">
                    <p className={cn(
                        "text-sm font-semibold",
                        remainingAmount >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                        {remainingAmount >= 0 
                            ? `${formatCurrency(remainingAmount)} restantes`
                            : `${formatCurrency(Math.abs(remainingAmount))} acima do limite`
                        }
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function BudgetsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
            </div>
        </div>
    )
}
