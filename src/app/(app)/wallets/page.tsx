// src/app/(app)/wallets/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Trash2, Edit, Banknote, CreditCard, PiggyBank, Landmark, CircleDollarSign } from "lucide-react";
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
                    <p className={cn("text-2xl font-bold text-foreground", wallet.balance < 0 && "text-red-500")}>R$ {wallet.balance.toFixed(2)}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
            </div>
        </div>
    )
}
