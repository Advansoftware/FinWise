
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
import { useTransactions } from "@/hooks/use-transactions.tsx";
import { Switch } from "../ui/switch";

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

  useEffect(() => {
    if (transaction) {
      setFormState({
        ...transaction,
        date: transaction.date ? new Date(transaction.date) : new Date(),
      });
    }
  }, [transaction]);

  const handleInputChange = (field: keyof Transaction, value: any) => {
    setFormState(prev => ({...prev, [field]: value}));
    if(field === 'category') {
        setFormState(prev => ({...prev, subcategory: ''})); // Reset subcategory when category changes
    }
  }
  
  const availableSubcategories = useMemo(() => {
      const category = formState.category as TransactionCategory | undefined;
      if (!category) return [];
      return subcategories[category] || [];
  }, [formState.category, subcategories]);

  const handleSubmit = async () => {
    const { item, amount, date, category } = formState;
    if (!item || !amount || !date || !category) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha Item, Valor, Data e Categoria.",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const updates: Partial<Transaction> = {
            ...formState,
            date: (formState.date as Date).toISOString(),
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
                     <div className="col-span-3 flex items-center justify-around p-1 rounded-full bg-muted">
                       <Button 
                            variant={formState.type === 'expense' ? 'destructive' : 'ghost'}
                            size="sm" 
                            className="w-full rounded-full"
                            onClick={() => handleInputChange('type', 'expense')}
                        >
                            Despesa
                        </Button>
                        <Button 
                             variant={formState.type === 'income' ? 'default' : 'ghost'}
                             size="sm" 
                             className="w-full rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 data-[variant=default]:bg-emerald-600 data-[variant=default]:text-white"
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
                        <SingleDatePicker date={formState.date as Date} setDate={(d) => handleInputChange('date', d)} />
                    </div>
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
                    <Select value={formState.subcategory || ''} onValueChange={(v) => handleInputChange('subcategory', v)} disabled={!formState.category || availableSubcategories.length === 0}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={availableSubcategories.length > 0 ? "Selecione" : "Nenhuma"} />
                        </SelectTrigger>
                        <SelectContent>
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
