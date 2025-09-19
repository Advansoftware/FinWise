// src/app/(app)/wallets/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Trash2, Edit, Banknote, CreditCard, PiggyBank, Landmark, CircleDollarSign, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreateWalletDialog } from "@/components/wallets/create-wallet-dialog";
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
import { Wallet, WalletType } from "@/lib/types";

const WalletIcon = ({ type, className }: { type: WalletType, className?: string }) => {
    const props = { className: cn("h-6 w-6 text-primary", className) };
    switch (type) {
        case 'Conta Corrente': return <Landmark {...props} />;
        case 'Cartão de Crédito': return <CreditCard {...props} />;
        case 'Poupança': return <PiggyBank {...props} />;
        case 'Investimentos': return <CircleDollarSign {...props} />;
        case 'Dinheiro': return <Banknote {...props} />;
        default: return <CircleDollarSign {...props} />;
    }
}

export default function WalletsPage() {
    const { wallets, isLoading, deleteWallet } = useWallets();
    
    // Calcular totais
    const totalPositive = wallets.filter(w => (w.balance || 0) > 0).reduce((sum, w) => sum + (w.balance || 0), 0);
    const totalNegative = wallets.filter(w => (w.balance || 0) < 0).reduce((sum, w) => sum + Math.abs(w.balance || 0), 0);
    const netBalance = totalPositive - totalNegative;
    
    if (isLoading) {
        return <WalletsSkeleton />
    }
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Carteiras</h1>
                    <p className="text-muted-foreground">Gerencie suas fontes de recursos. Carteiras representam suas contas bancárias, cartões de crédito ou até mesmo dinheiro físico. Toda transação precisa estar associada a uma carteira.</p>
                </div>
                 <CreateWalletDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Nova Carteira
                    </Button>
                </CreateWalletDialog>
            </div>
            
            {/* Cards de Totais - Separados visualmente das carteiras individuais */}
            {wallets.length > 0 && (
                <div className="space-y-4">
                    <div className="border-b border-border pb-2">
                        <h2 className="text-xl font-semibold">Resumo Financeiro</h2>
                        <p className="text-sm text-muted-foreground">Visão geral dos saldos das suas carteiras</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Positivo */}
                        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                                    Total Positivo
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    R$ {totalPositive.toFixed(2)}
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Saldo acumulado das carteiras com valores positivos
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Negativo */}
                        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">
                                    Total Negativo
                                </CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    R$ {totalNegative.toFixed(2)}
                                </div>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Soma das dívidas (valores negativos)
                                </p>
                            </CardContent>
                        </Card>

                        {/* Saldo Líquido */}
                        <Card className={cn(
                            "border-2",
                            netBalance >= 0 
                                ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                                : "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={cn(
                                    "text-sm font-medium",
                                    netBalance >= 0
                                        ? "text-blue-900 dark:text-blue-100"
                                        : "text-orange-900 dark:text-orange-100"
                                )}>
                                    Saldo Líquido
                                </CardTitle>
                                <DollarSign className={cn(
                                    "h-4 w-4",
                                    netBalance >= 0
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-orange-600 dark:text-orange-400"
                                )} />
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    netBalance >= 0
                                        ? "text-blue-700 dark:text-blue-300"
                                        : "text-orange-700 dark:text-orange-300"
                                )}>
                                    R$ {netBalance.toFixed(2)}
                                </div>
                                <p className={cn(
                                    "text-xs mt-1",
                                    netBalance >= 0
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-orange-600 dark:text-orange-400"
                                )}>
                                    {netBalance >= 0 ? "Patrimônio líquido positivo" : "Patrimônio líquido negativo"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            
            {/* Separador visual entre totais e carteiras individuais */}
            {wallets.length > 0 && (
                <div className="space-y-4">
                    <div className="border-b border-border pb-2">
                        <h2 className="text-xl font-semibold">Carteiras Individuais</h2>
                        <p className="text-sm text-muted-foreground">Gerencie cada uma das suas carteiras</p>
                    </div>
                </div>
            )}
            
            {wallets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallets.map(wallet => (
                       <WalletCard key={wallet.id} wallet={wallet} onDelete={() => deleteWallet(wallet.id)} />
                    ))}
                </div>
            ) : (
                 <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                       <Landmark className="h-12 w-12 mb-4 text-primary/50" />
                       <h3 className="text-lg font-semibold text-foreground">Nenhuma carteira encontrada.</h3>
                       <p className="text-sm max-w-md mx-auto">Para começar, você precisa criar sua primeira carteira. Pense nela como sua conta bancária principal ou o cartão que mais usa.</p>
                       <CreateWalletDialog>
                         <Button className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Criar Primeira Carteira
                         </Button>
                       </CreateWalletDialog>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function WalletCard({ wallet, onDelete }: { wallet: Wallet, onDelete: () => void }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/20">
                            <WalletIcon type={wallet.type} />
                        </div>
                        <div>
                             <CardTitle>{wallet.name}</CardTitle>
                            <CardDescription>{wallet.type}</CardDescription>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <CreateWalletDialog initialData={wallet}>
                                <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                    <Edit className="mr-2 h-4 w-4"/>Editar
                                </div>
                            </CreateWalletDialog>
                           
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-400 focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4"/>Excluir Carteira
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a carteira "{wallet.name}". Você só pode excluir carteiras que não possuem transações.
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
                     <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className={cn("text-2xl font-bold text-foreground", (wallet.balance || 0) < 0 && "text-red-500")}>R$ {(wallet.balance || 0).toFixed(2)}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function WalletsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            
            {/* Skeleton para cards de totais */}
            <div className="space-y-4">
                <div className="border-b border-border pb-2">
                    <Skeleton className="h-6 w-40 mb-1" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
            
            {/* Skeleton para carteiras individuais */}
            <div className="space-y-4">
                <div className="border-b border-border pb-2">
                    <Skeleton className="h-6 w-44 mb-1" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-44" />
                    <Skeleton className="h-44" />
                    <Skeleton className="h-44" />
                </div>
            </div>
        </div>
    )
}
