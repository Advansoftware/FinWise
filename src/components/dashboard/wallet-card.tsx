
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Transaction } from "@/lib/types";
import { ArrowDown, ArrowUp, Wallet, Minus } from "lucide-react";
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

    return (
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl h-full">
            <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                        <Wallet className="h-4 w-4"/>
                    </div>
                    <div>
                        <CardTitle className="text-sm sm:text-base">Carteira Consolidada</CardTitle>
                        <CardDescription className="text-xs">Balanço total e do período</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                     <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Saldo Total</p>
                        <p className={cn("text-xl sm:text-2xl md:text-3xl font-bold tracking-tight", totalBalance >= 0 ? "text-foreground" : "text-destructive")}>
                            R$ {totalBalance.toFixed(2)}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                         <div className="flex items-center gap-1.5">
                             <div className="p-1 rounded-full bg-emerald-500/10">
                                <ArrowDown className="h-3 w-3 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Receitas</p>
                                <p className="text-sm font-semibold text-emerald-500">
                                    +R$ {totalIncome.toFixed(2)}
                                </p>
                            </div>
                        </div>
                         <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-full bg-red-500/10">
                                <ArrowUp className="h-3 w-3 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Despesas</p>
                                <p className="text-sm font-semibold text-red-500">
                                    -R$ {totalExpense.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
