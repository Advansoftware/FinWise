
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
import { Loader2, ArrowRightLeft } from "lucide-react";
import { SingleDatePicker } from "../single-date-picker";
import { useTransactions } from "@/hooks/use-transactions.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Switch } from "../ui/switch";
import { cn } from "@/lib/utils";


export function AddTransactionSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { addTransaction, categories, subcategories, allTransactions } = useTransactions();
  
  const [formState, setFormState] = useState({
      item: '',
      establishment: '',
      quantity: '1',
      amount: '',
      date: new Date(),
      category: '' as TransactionCategory | '',
      subcategory: '',
      type: 'expense' as 'income' | 'expense'
  });
  
  // States for autocomplete
  const [itemQuery, setItemQuery] = useState("");
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);

  const resetForm = () => {
    setFormState({
        item: '',
        establishment: '',
        quantity: '1',
        amount: '',
        date: new Date(),
        category: '',
        subcategory: '',
        type: 'expense'
    });
    setItemQuery("");
  };
  
  const handleInputChange = (field: keyof typeof formState, value: any) => {
    setFormState(prev => ({...prev, [field]: value}));
    if(field === 'category') {
        setFormState(prev => ({...prev, subcategory: ''})); // Reset subcategory when category changes
    }
  }

  const handleItemSelect = (transaction: Transaction) => {
    setFormState({
      item: transaction.item,
      establishment: transaction.establishment || '',
      quantity: '1', // Default quantity to 1 on suggestion
      amount: String(transaction.amount),
      date: new Date(), // Default date to today
      category: transaction.category,
      subcategory: transaction.subcategory || '',
      type: transaction.type,
    });
    setItemQuery(transaction.item);
    setIsItemPopoverOpen(false);
  }

  const availableSubcategories = useMemo(() => {
      if (!formState.category) return [];
      return subcategories[formState.category] || [];
  }, [formState.category, subcategories]);

  const uniqueTransactions = useMemo(() => {
    const seen = new Set<string>();
    return allTransactions.filter(t => {
      const duplicate = seen.has(t.item.toLowerCase());
      seen.add(t.item.toLowerCase());
      return !duplicate;
    });
  }, [allTransactions]);
  
  const filteredItems = useMemo(() => {
      if (!itemQuery) return uniqueTransactions.slice(0, 5); // Show some initial suggestions
      return uniqueTransactions.filter(t => t.item.toLowerCase().includes(itemQuery.toLowerCase())).slice(0, 5);
  }, [itemQuery, uniqueTransactions]);


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
        const newTransaction: Omit<Transaction, 'id'> = {
            item: formState.item,
            establishment: formState.establishment || undefined,
            amount: parseFloat(formState.amount),
            date: formState.date.toISOString(),
            category: formState.category,
            subcategory: formState.subcategory || undefined,
            quantity: parseInt(formState.quantity),
            type: formState.type
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
                    <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                        <PopoverTrigger asChild className="col-span-3">
                            <Input 
                                id="item" 
                                placeholder="ex: Café" 
                                value={formState.item} 
                                onChange={(e) => {
                                    handleInputChange('item', e.target.value);
                                    setItemQuery(e.target.value);
                                    if (!isItemPopoverOpen) setIsItemPopoverOpen(true);
                                }}
                            />
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                            <Command>
                                <CommandInput placeholder="Buscar item existente..." onValueChange={setItemQuery} />
                                <CommandList>
                                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
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
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Transação
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
