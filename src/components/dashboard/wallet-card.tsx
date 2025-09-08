
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Transaction } from "@/lib/types";
import { ArrowDown, ArrowUp, Wallet, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallets } from "@/hooks/use-wallets";

interface WalletCardProps {
    transactions: Transaction[];
}

export function WalletCard({ transactions }: WalletCardProps) {
    const { wallets, isLoading } = useWallets();

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netFlow = totalIncome - totalExpense;
    
    // Calcular transações por dia (últimos 7 dias)
    const last7Days = new Array(7).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();
    
    const dailyExpenses = last7Days.map(date => {
        return transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(date))
            .reduce((sum, t) => sum + t.amount, 0);
    });
    
    const avgDailyExpense = dailyExpenses.reduce((sum, exp) => sum + exp, 0) / 7;
    
    // Calcular taxa de economia (receitas vs despesas)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    
    // Maior categoria de gasto
    const categoryExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryExpenses)
        .sort(([,a], [,b]) => b - a)[0];

    return (
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                        <Wallet className="h-4 w-4"/>
                    </div>
                    <div>
                        <CardTitle className="text-sm">Carteira Consolidada</CardTitle>
                        <CardDescription className="text-xs">Balanço total e insights do período</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="flex flex-col gap-4">
                    {/* Saldo Total */}
                    <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Saldo Total</p>
                        <p className={cn("text-xl font-bold tracking-tight", totalBalance >= 0 ? "text-foreground" : "text-destructive")}>
                            R$ {totalBalance.toFixed(2)}
                        </p>
                    </div>
                    
                    {/* Receitas e Despesas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-full bg-emerald-500/10">
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Receitas</p>
                                <p className="text-sm font-semibold text-emerald-500 truncate">
                                    +R$ {totalIncome.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-full bg-red-500/10">
                                <ArrowUp className="h-3 w-3 text-red-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Despesas</p>
                                <p className="text-sm font-semibold text-red-500 truncate">
                                    -R$ {totalExpense.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Fluxo Líquido */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                            {netFlow >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">Fluxo Líquido</span>
                        </div>
                        <span className={cn("text-sm font-semibold", netFlow >= 0 ? "text-emerald-500" : "text-red-500")}>
                            R$ {netFlow.toFixed(2)}
                        </span>
                    </div>
                    
                    {/* Insights Adicionais */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Gasto Médio/Dia</span>
                            </div>
                            <p className="font-medium">R$ {avgDailyExpense.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1">
                                <PieChart className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Taxa de Economia</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <p className={cn("font-medium", savingsRate >= 0 ? "text-emerald-500" : "text-red-500")}>
                                    {savingsRate.toFixed(1)}%
                                </p>
                                {savingsRate >= 20 && <Badge variant="secondary" className="text-xs px-1 py-0">Boa!</Badge>}
                            </div>
                        </div>
                    </div>
                    
                    {/* Maior Categoria */}
                    {topCategory && (
                        <div className="p-2 rounded-lg border border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="text-xs text-muted-foreground">Maior Gasto</span>
                                </div>
                                <span className="text-xs font-medium">{topCategory[0]}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                                <Progress 
                                    value={totalExpense > 0 ? (topCategory[1] / totalExpense) * 100 : 0} 
                                    className="flex-1 h-1 mr-2" 
                                />
                                <span className="text-xs font-semibold text-red-500">
                                    R$ {topCategory[1].toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
