
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SingleDatePicker } from "../single-date-picker";
import { useTransactions } from "@/hooks/use-transactions";
import { Switch } from "../ui/switch";
import { cn } from "@/lib/utils";
import { useWallets } from "@/hooks/use-wallets";

interface EditTransactionSheetProps {
    transaction: Transaction;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function EditTransactionSheet({ transaction, isOpen, setIsOpen }: EditTransactionSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Partial<Transaction>>({});
  const [updateAll, setUpdateAll] = useState(false);
  
  const { toast } = useToast();
  const { updateTransaction, categories, subcategories } = useTransactions();
  const { wallets } = useWallets();

  useEffect(() => {
    if (transaction) {
      setFormState({
        ...transaction,
        date: transaction.date || new Date().toISOString(),
      });
    }
  }, [transaction]);

  const handleInputChange = (field: keyof Transaction, value: any) => {
    if(field === 'category') {
        setFormState(prev => ({
            ...prev, 
            [field]: value,
            subcategory: undefined // Reset subcategory when category changes
        })); 
    } else if(field === 'subcategory' && value === 'none') {
        setFormState(prev => ({...prev, [field]: undefined}));
    } else {
        setFormState(prev => ({...prev, [field]: value}));
    }
  }
  
  const availableSubcategories = useMemo(() => {
      const category = formState.category as TransactionCategory | undefined;
      if (!category) return [];
      return subcategories[category] || [];
  }, [formState.category, subcategories]);

  const handleSubmit = async () => {
    const { item, amount, date, category, walletId } = formState;
    if (!item || !amount || !date || !category || !walletId) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha todos os campos obrigatórios.",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const updates: Partial<Transaction> = {
            ...formState,
            date: new Date(formState.date || new Date()).toISOString(),
            amount: Number(formState.amount),
            quantity: Number(formState.quantity),
        };
        delete updates.id; // Don't try to update the ID

        await updateTransaction(transaction.id, updates, updateAll, transaction.item);

        toast({
            title: "Sucesso!",
            description: "Sua transação foi atualizada.",
        });
        
        setIsOpen(false);
        
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível atualizar a transação. Tente novamente.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!transaction) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Editar Transação</SheetTitle>
          <SheetDescription>
            Modifique os detalhes da sua movimentação.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Tipo</Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                         <Button
                            variant={formState.type === 'expense' ? 'destructive' : 'outline'}
                            onClick={() => handleInputChange('type', 'expense')}
                         >
                            Despesa
                        </Button>
                         <Button
                             variant={formState.type === 'income' ? 'default' : 'outline'}
                              className={cn("bg-transparent border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white", formState.type === 'income' && "bg-emerald-600 text-white")}
                             onClick={() => handleInputChange('type', 'income')}
                         >
                            Receita
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item" className="text-right">Item</Label>
                    <Input id="item" className="col-span-3" value={formState.item || ''} onChange={(e) => handleInputChange('item', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="establishment" className="text-right">Estabelecimento</Label>
                    <Input id="establishment" className="col-span-3" value={formState.establishment || ''} onChange={(e) => handleInputChange('establishment', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">Qtd.</Label>
                    <Input id="quantity" type="number" className="col-span-3" value={formState.quantity || 1} onChange={(e) => handleInputChange('quantity', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Valor</Label>
                    <Input id="amount" type="number" className="col-span-3" value={formState.amount || ''} onChange={(e) => handleInputChange('amount', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Data</Label>
                    <div className="col-span-3">
                        <SingleDatePicker date={new Date(formState.date || new Date())} setDate={(d) => handleInputChange('date', d?.toISOString() || new Date().toISOString())} />
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wallet" className="text-right">Carteira</Label>
                    <Select value={formState.walletId || ''} onValueChange={(value) => handleInputChange('walletId', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma carteira" />
                    </SelectTrigger>
                    <SelectContent>
                        {wallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Categoria</Label>
                    <Select value={formState.category || ''} onValueChange={(value) => handleInputChange('category', value as TransactionCategory)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subcategory" className="text-right">Subcategoria</Label>
                    <Select value={formState.subcategory || 'none'} onValueChange={(v) => handleInputChange('subcategory', v)} disabled={!formState.category || availableSubcategories.length === 0}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={!formState.category ? "Selecione uma categoria primeiro" : availableSubcategories.length > 0 ? "Selecione uma subcategoria" : "Nenhuma subcategoria disponível"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {availableSubcategories.map(sub => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="update-all" className="text-right">Aplicar a todos</Label>
                    <div className="col-span-3 flex items-center space-x-2">
                         <Switch
                            id="update-all"
                            checked={updateAll}
                            onCheckedChange={setUpdateAll}
                        />
                         <Label htmlFor="update-all" className="text-xs text-muted-foreground font-normal">
                           Atualizar para todos os itens "{transaction.item}"
                        </Label>
                    </div>
                </div>
            </div>
        </div>
        <SheetFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
