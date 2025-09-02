"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { addTransaction } from "@/app/actions";
import { Loader2 } from "lucide-react";
import { SingleDatePicker } from "../single-date-picker";
import { useTransactions } from "@/hooks/use-transactions";


const categories: TransactionCategory[] = ["Supermercado", "Transporte", "Entretenimento", "Contas", "Restaurante", "Saúde"];

export function AddTransactionSheet({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { refreshTransactions } = useTransactions();


  const handleSubmit = async () => {
    if (!item || !amount || !date || !category) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha todos os campos obrigatórios.",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const newTransaction: Omit<Transaction, 'id'> = {
            item,
            amount: parseFloat(amount),
            date: date.toISOString(),
            category,
            subcategory: subcategory || undefined,
        };
        await addTransaction(newTransaction);

        toast({
            title: "Sucesso!",
            description: "Sua transação foi adicionada.",
        });
        
        // Reset form and close sheet
        setItem('');
        setAmount('');
        setDate(new Date());
        setCategory('');
        setSubcategory('');

        // Revalidate data on the page
        await refreshTransactions();
        
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
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Nova Transação</SheetTitle>
          <SheetDescription>
            Insira os detalhes da sua compra abaixo. Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item" className="text-right">
              Item
            </Label>
            <Input id="item" placeholder="ex: Café" className="col-span-3" value={item} onChange={(e) => setItem(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor
            </Label>
            <Input id="amount" type="number" placeholder="ex: 4.50" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <div className="col-span-3">
              <SingleDatePicker date={date} setDate={setDate} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
             <Select value={category} onValueChange={(value) => setCategory(value as TransactionCategory)}>
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
            <Label htmlFor="subcategory" className="text-right">
              Subcategoria
            </Label>
            <Input id="subcategory" placeholder="ex: Bebidas (Opcional)" className="col-span-3" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
          </div>
        </div>
        <SheetFooter>
            <SheetClose asChild>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Transação
                </Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
