
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
import { useWallets } from "@/hooks/use-wallets";
import { Box, Stack } from '@mui/material';

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

        await updateTransaction(transaction.id, updates, transaction);

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
      <SheetContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <SheetHeader>
          <SheetTitle>Editar Transação</SheetTitle>
          <SheetDescription>
            Modifique os detalhes da sua movimentação.
          </SheetDescription>
        </SheetHeader>
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 6, mr: -6 }}>
            <Box sx={{ display: 'grid', gap: 4, py: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label sx={{ textAlign: 'right' }}>Tipo</Label>
                    <Box sx={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                         <Button
                            variant={formState.type === 'expense' ? 'destructive' : 'outline'}
                            onClick={() => handleInputChange('type', 'expense')}
                         >
                            Despesa
                        </Button>
                         <Button
                             variant={formState.type === 'income' ? 'default' : 'outline'}
                              sx={{ 
                                bgcolor: formState.type === 'income' ? '#10b981' : 'transparent',
                                borderColor: '#10b981',
                                color: formState.type === 'income' ? '#fff' : '#10b981',
                                '&:hover': { bgcolor: '#10b981', color: '#fff' }
                              }}
                             onClick={() => handleInputChange('type', 'income')}
                         >
                            Receita
                        </Button>
                    </Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="item" sx={{ textAlign: 'right' }}>Item</Label>
                    <Input id="item" sx={{ gridColumn: 'span 3' }} value={formState.item || ''} onChange={(e) => handleInputChange('item', e.target.value)} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="establishment" sx={{ textAlign: 'right' }}>Estabelecimento</Label>
                    <Input id="establishment" sx={{ gridColumn: 'span 3' }} value={formState.establishment || ''} onChange={(e) => handleInputChange('establishment', e.target.value)} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="quantity" sx={{ textAlign: 'right' }}>Qtd.</Label>
                    <Input id="quantity" type="number" sx={{ gridColumn: 'span 3' }} value={formState.quantity || 1} onChange={(e) => handleInputChange('quantity', e.target.value)} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="amount" sx={{ textAlign: 'right' }}>Valor</Label>
                    <Input id="amount" type="number" sx={{ gridColumn: 'span 3' }} value={formState.amount || ''} onChange={(e) => handleInputChange('amount', e.target.value)} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="date" sx={{ textAlign: 'right' }}>Data</Label>
                    <Box sx={{ gridColumn: 'span 3' }}>
                        <SingleDatePicker date={new Date(formState.date || new Date())} setDate={(d) => handleInputChange('date', d?.toISOString() || new Date().toISOString())} />
                    </Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="wallet" sx={{ textAlign: 'right' }}>Carteira</Label>
                    <Select value={formState.walletId || ''} onValueChange={(value) => handleInputChange('walletId', value)}>
                    <SelectTrigger sx={{ gridColumn: 'span 3' }}>
                        <SelectValue placeholder="Selecione uma carteira" />
                    </SelectTrigger>
                    <SelectContent>
                        {wallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="category" sx={{ textAlign: 'right' }}>Categoria</Label>
                    <Select value={formState.category || ''} onValueChange={(value) => handleInputChange('category', value as TransactionCategory)}>
                        <SelectTrigger sx={{ gridColumn: 'span 3' }}>
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="subcategory" sx={{ textAlign: 'right' }}>Subcategoria</Label>
                    <Select value={formState.subcategory || 'none'} onValueChange={(v) => handleInputChange('subcategory', v)} disabled={!formState.category || availableSubcategories.length === 0}>
                        <SelectTrigger sx={{ gridColumn: 'span 3' }}>
                            <SelectValue placeholder={!formState.category ? "Selecione uma categoria primeiro" : availableSubcategories.length > 0 ? "Selecione uma subcategoria" : "Nenhuma subcategoria disponível"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {availableSubcategories.map(sub => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Box>
                 <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', gap: 4 }}>
                    <Label htmlFor="update-all" sx={{ textAlign: 'right' }}>Aplicar a todos</Label>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ gridColumn: 'span 3' }}>
                         <Switch
                            id="update-all"
                            checked={updateAll}
                            onCheckedChange={setUpdateAll}
                        />
                         <Label htmlFor="update-all" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 400 }}>
                           Atualizar para todos os itens "{transaction.item}"
                        </Label>
                    </Stack>
                </Box>
            </Box>
        </Box>
        <SheetFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} className="animate-spin" />}
                Salvar Alterações
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
