
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
import { Box } from '@mui/material'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SingleDatePicker } from "../single-date-picker";
import { useTransactions } from "@/hooks/use-transactions";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";


export function AddTransactionSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { addTransaction, categories, subcategories, allTransactions } = useTransactions();
  const { wallets } = useWallets();
  const { user } = useAuth();
  
  const [formState, setFormState] = useState({
      item: '',
      establishment: '',
      quantity: '1',
      amount: '',
      date: new Date(),
      category: '' as TransactionCategory | '',
      subcategory: '',
      type: 'expense' as 'income' | 'expense' | 'transfer',
      walletId: '',
      toWalletId: '', // For transfers
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
        toWalletId: '',
    });
    setItemInputValue("");
  };
  
  const handleInputChange = (field: keyof typeof formState, value: any) => {
    setFormState(prev => ({...prev, [field]: value}));
    
    if(field === 'category') {
        setFormState(prev => ({...prev, subcategory: ''}));
    }
    
    if (field === 'type') {
      if (value === 'transfer') {
        setFormState(prev => ({...prev, category: 'Transferência', item: 'Transferência entre contas'}));
        setItemInputValue('Transferência entre contas');
      } else if (formState.category === 'Transferência') {
         // Clear fields when switching away from 'transfer'
         setFormState(prev => ({...prev, category: '', item: ''}));
         setItemInputValue('');
      }
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
    // Evitar múltiplas submissões
    if (isSubmitting) return;
    
    const finalItem = itemInputValue;
    const { amount, date, category, walletId, toWalletId, type } = formState;

    if (!finalItem || !amount || !date) {
        toast({ variant: "destructive", title: "Campos obrigatórios", description: "Por favor, preencha Item, Valor e Data."});
        return;
    }
    
    if (type === 'transfer') {
        if (!walletId || !toWalletId) {
            toast({ variant: "destructive", title: "Campos obrigatórios", description: "Para transferências, as carteiras de origem e destino são obrigatórias."});
            return;
        }
        if (walletId === toWalletId) {
            toast({ variant: "destructive", title: "Seleção Inválida", description: "A carteira de origem não pode ser a mesma que a de destino."});
            return;
        }
    } else {
        if (!walletId || !category) {
             toast({ variant: "destructive", title: "Campos obrigatórios", description: "Por favor, preencha Categoria e Carteira."});
             return;
        }
    }
    
    setIsSubmitting(true);
    try {
        const newTransaction: Omit<Transaction, 'id'> = {
            userId: user?.uid || '',
            ...formState,
            item: finalItem,
            amount: parseFloat(formState.amount),
            date: formState.date.toISOString(),
            quantity: parseInt(formState.quantity),
            walletId,
            toWalletId: formState.type === 'transfer' ? formState.toWalletId : undefined,
            category: formState.type === 'transfer' ? 'Transferência' : (formState.category || 'Outros') as TransactionCategory,
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

  const typeDescriptions = {
      expense: "Registra uma saída de dinheiro. Diminui o saldo da carteira selecionada.",
      income: "Registra uma entrada de dinheiro. Aumenta o saldo da carteira selecionada.",
      transfer: "Move dinheiro entre duas de suas carteiras. Não altera seu saldo total, apenas o local do dinheiro."
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent sx={{ width: '100%', maxWidth: { sm: '28rem' }, display: 'flex', flexDirection: 'column', height: { xs: '100%', sm: 'auto' } }}>
                <SheetHeader sx={{ gap: 2, pb: 2 }}>
          <SheetTitle>Adicionar Nova Transação</SheetTitle>
          <SheetDescription>
            Insira os detalhes da sua movimentação.
          </SheetDescription>
        </SheetHeader>
        
                <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, pr: 2 }}>
            {/* Tipo de Transação */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Label sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Tipo</Label>
                <ToggleGroup 
                  type="single" 
                  value={formState.type} 
                  onValueChange={(value) => handleInputChange('type', value || 'expense')} 
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}
                >
                    <ToggleGroupItem value="expense" aria-label="Despesa" className="data-[state=on]:bg-destructive/80 data-[state=on]:text-white">
                        Despesa
                    </ToggleGroupItem>
                    <ToggleGroupItem value="income" aria-label="Receita" className="data-[state=on]:bg-emerald-600 data-[state=on]:text-white">
                        Receita
                    </ToggleGroupItem>
                    <ToggleGroupItem value="transfer" aria-label="Transferência" className="data-[state=on]:bg-sky-600 data-[state=on]:text-white">
                        Transfer
                    </ToggleGroupItem>
                </ToggleGroup>
                <Box component="p" sx={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {typeDescriptions[formState.type]}
                </Box>
            </Box>

            {/* Valor */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Label htmlFor="amount" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Valor</Label>
                <Input 
                    id="amount" 
                    type="number" 
                    placeholder="ex: 50.00" 
                    value={formState.amount} 
                    onChange={(e) => handleInputChange('amount', e.target.value)} 
                />
            </Box>

            {/* Data */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Label htmlFor="date" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Data</Label>
                <SingleDatePicker date={formState.date} setDate={(d) => handleInputChange('date', d)} />
            </Box>

            {formState.type === 'transfer' ? (
                <>
                    {/* Carteira de Origem */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="wallet" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>De</Label>
                        <Select value={formState.walletId} onValueChange={(value) => handleInputChange('walletId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Carteira de Origem" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map(wallet => (
                                    <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Box>

                    {/* Carteira de Destino */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="toWallet" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Para</Label>
                        <Select value={formState.toWalletId} onValueChange={(value) => handleInputChange('toWalletId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Carteira de Destino" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.filter(w => w.id !== formState.walletId).map(wallet => (
                                    <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Box>
                </>
            ) : (
                <>
                    {/* Item */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="item" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Item</Label>
                        <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                            <PopoverAnchor>
                                <Input 
                                    id="item" 
                                    placeholder="ex: Café" 
                                    value={itemInputValue} 
                                    onChange={(e) => setItemInputValue(e.target.value)}
                                    autoComplete="off"
                                    disabled={(formState.type as any) === 'transfer'}
                                />
                            </PopoverAnchor>
                            <PopoverContent sx={{ p: 0, width: 'var(--radix-popover-trigger-width)' }} onOpenAutoFocus={(e) => e.preventDefault()}>
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
                    </Box>

                    {/* Estabelecimento */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="establishment" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Estabelecimento</Label>
                        <Input 
                            id="establishment" 
                            placeholder="ex: Padaria do Zé" 
                            value={formState.establishment} 
                            onChange={(e) => handleInputChange('establishment', e.target.value)} 
                        />
                    </Box>

                    {/* Quantidade */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="quantity" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Quantidade</Label>
                        <Input 
                            id="quantity" 
                            type="number" 
                            placeholder="ex: 1" 
                            value={formState.quantity} 
                            onChange={(e) => handleInputChange('quantity', e.target.value)} 
                        />
                    </Box>

                    {/* Carteira */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="wallet" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Carteira</Label>
                        <Select value={formState.walletId} onValueChange={(value) => handleInputChange('walletId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma carteira" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map(wallet => (
                                    <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Box>

                    {/* Categoria */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="category" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Categoria</Label>
                        <Select value={formState.category} onValueChange={(value) => handleInputChange('category', value as TransactionCategory)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.filter(c => c !== 'Transferência').map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Box>

                    {/* Subcategoria */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Label htmlFor="subcategory" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Subcategoria</Label>
                        <Select value={formState.subcategory} onValueChange={(v) => handleInputChange('subcategory', v)} disabled={!formState.category || availableSubcategories.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={availableSubcategories.length > 0 ? "Selecione" : "Nenhuma"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSubcategories.map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Box>
                </>
            )}
        </Box>
        
        <SheetFooter sx={{ pt: 6 }}>
            <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || wallets.length === 0}
                sx={{ width: '100%' }}
            >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {wallets.length === 0 ? "Crie uma carteira primeiro" : "Salvar Transação"}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
