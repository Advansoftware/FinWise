
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
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
import { useWallets } from "@/hooks/use-wallets";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn } from "@/lib/utils";


export function AddTransactionSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { addTransaction, categories, subcategories, allTransactions } = useTransactions();
  const { wallets } = useWallets();
  
  const [formState, setFormState] = useState({
      item: '',
      establishment: '',
      quantity: '1',
      amount: '',
      date: new Date(),
      category: '' as TransactionCategory | '',
      subcategory: '',
      type: 'expense' as 'income' | 'expense',
      walletId: '',
  });
  
  const [itemInputValue, setItemInputValue] = useState("");
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);

  const uniqueTransactions = useMemo(() => {
    const seen = new Set<string>();
    return allTransactions.filter(t => {
      const duplicate = seen.has(t.item.toLowerCase());
      seen.add(t.item.toLowerCase());
      return !duplicate;
    });
  }, [allTransactions]);
  
  const filteredItems = useMemo(() => {
      if (!itemInputValue) return [];
      return uniqueTransactions.filter(t => t.item.toLowerCase().includes(itemInputValue.toLowerCase())).slice(0, 5);
  }, [itemInputValue, uniqueTransactions]);

  useEffect(() => {
      if (itemInputValue && filteredItems.length > 0) {
          setIsItemPopoverOpen(true);
      } else {
          setIsItemPopoverOpen(false);
      }
  }, [itemInputValue, filteredItems]);


  const resetForm = () => {
    setFormState({
        item: '',
        establishment: '',
        quantity: '1',
        amount: '',
        date: new Date(),
        category: '',
        subcategory: '',
        type: 'expense',
        walletId: '',
    });
    setItemInputValue("");
  };
  
  const handleInputChange = (field: keyof typeof formState, value: any) => {
    setFormState(prev => ({...prev, [field]: value}));
    if(field === 'category') {
        setFormState(prev => ({...prev, subcategory: ''}));
    }
  }

  const handleItemSelect = (transaction: Transaction) => {
    setFormState(prev => ({
      ...prev,
      item: transaction.item,
      establishment: transaction.establishment || '',
      amount: String(transaction.amount),
      category: transaction.category,
      subcategory: transaction.subcategory || '',
    }));
    setItemInputValue(transaction.item);
    setIsItemPopoverOpen(false);
  }

  const availableSubcategories = useMemo(() => {
      if (!formState.category) return [];
      return subcategories[formState.category] || [];
  }, [formState.category, subcategories]);

  const handleSubmit = async () => {
    const finalItem = itemInputValue;
    const { amount, date, category, walletId } = formState;

    if (!finalItem || !amount || !date || !category || !walletId) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha Item, Valor, Data, Categoria e Carteira.",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const newTransaction: Omit<Transaction, 'id'> = {
            ...formState,
            item: finalItem,
            amount: parseFloat(formState.amount),
            date: formState.date.toISOString(),
            quantity: parseInt(formState.quantity),
            walletId,
        };
        await addTransaction(newTransaction);

        toast({
            title: "Sucesso!",
            description: "Sua transação foi adicionada.",
        });
        
        resetForm();
        setIsOpen(false);
        
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível adicionar a transação. Tente novamente.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Adicionar Nova Transação</SheetTitle>
          <SheetDescription>
            Insira os detalhes da sua movimentação.
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
                     <div className="col-span-3">
                        <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                            <PopoverAnchor>
                                <Input 
                                    id="item" 
                                    placeholder="ex: Café" 
                                    value={itemInputValue} 
                                    onChange={(e) => setItemInputValue(e.target.value)}
                                    autoComplete="off"
                                />
                            </PopoverAnchor>
                            <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" onOpenAutoFocus={(e) => e.preventDefault()}>
                                <Command>
                                    <CommandList>
                                        <CommandEmpty>Nenhuma sugestão encontrada.</CommandEmpty>
                                        <CommandGroup>
                                        {filteredItems.map((transaction) => (
                                            <CommandItem key={transaction.id} onSelect={() => handleItemSelect(transaction)}>
                                                {transaction.item}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="establishment" className="text-right">Estabelecimento</Label>
                    <Input id="establishment" placeholder="ex: Padaria do Zé" className="col-span-3" value={formState.establishment} onChange={(e) => handleInputChange('establishment', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">Qtd.</Label>
                    <Input id="quantity" type="number" placeholder="ex: 1" className="col-span-3" value={formState.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Valor</Label>
                    <Input id="amount" type="number" placeholder="ex: 4.50" className="col-span-3" value={formState.amount} onChange={(e) => handleInputChange('amount', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Data</Label>
                    <div className="col-span-3">
                    <SingleDatePicker date={formState.date} setDate={(d) => handleInputChange('date', d)} />
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wallet" className="text-right">Carteira</Label>
                    <Select value={formState.walletId} onValueChange={(value) => handleInputChange('walletId', value)}>
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
                    <Select value={formState.category} onValueChange={(value) => handleInputChange('category', value as TransactionCategory)}>
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
                    <Select value={formState.subcategory} onValueChange={(v) => handleInputChange('subcategory', v)} disabled={!formState.category || availableSubcategories.length === 0}>
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
            </div>
        </div>
        <SheetFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting || wallets.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {wallets.length === 0 ? "Crie uma carteira primeiro" : "Salvar Transação"}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
