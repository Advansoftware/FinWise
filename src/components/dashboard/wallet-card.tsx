
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
    const periodBalance = totalIncome - totalExpense;

    return (
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20 text-primary">
                        <Wallet className="h-6 w-6"/>
                    </div>
                    <div>
                        <CardTitle>Carteira Consolidada</CardTitle>
                        <CardDescription>Balanço total e do período selecionado</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                     <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Saldo Total</p>
                        <p className={cn("text-4xl font-bold tracking-tight", totalBalance >= 0 ? "text-foreground" : "text-destructive")}>
                            R$ {totalBalance.toFixed(2)}
                        </p>
                    </div>
                    <div className="flex gap-4 md:gap-8">
                         <div className="flex items-center gap-2">
                             <div className="p-2 rounded-full bg-emerald-500/10">
                                <ArrowDown className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Receitas (período)</p>
                                <p className="font-semibold text-emerald-500">
                                    R$ {totalIncome.toFixed(2)}
                                </p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-red-500/10">
                                <ArrowUp className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Despesas (período)</p>
                                <p className="font-semibold text-red-500">
                                    R$ {totalExpense.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
