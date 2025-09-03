// src/components/budgets/automatic-budget-dialog.tsx
'use client';

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBudgets } from "@/hooks/use-budsgets";
import { Loader2, Sparkles, CheckCircle, Circle } from "lucide-react";
import { BudgetItemSchema } from "@/ai/ai-types";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";

type SuggestedBudget = z.infer<typeof BudgetItemSchema>;

interface AutomaticBudgetDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  suggestedBudgets: SuggestedBudget[];
}

export function AutomaticBudgetDialog({ isOpen, setIsOpen, suggestedBudgets }: AutomaticBudgetDialogProps) {
  const { toast } = useToast();
  const { addBudget, isLoading: isSaving } = useBudgets();
  const [selectedBudgets, setSelectedBudgets] = useState<SuggestedBudget[]>(suggestedBudgets);

  // Sync state when suggestions change
  useState(() => {
    setSelectedBudgets(suggestedBudgets);
  });

  const handleToggleSelection = (budget: SuggestedBudget) => {
    setSelectedBudgets(prev => 
        prev.some(b => b.category === budget.category)
            ? prev.filter(b => b.category !== budget.category)
            : [...prev, budget]
    );
  }

  const handleCreateBudgets = async () => {
    if (selectedBudgets.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhum orçamento selecionado'});
        return;
    }

    try {
        const creationPromises = selectedBudgets.map(b => 
            addBudget({
                name: b.name,
                category: b.category,
                amount: b.amount,
                period: 'monthly'
            })
        );
        await Promise.all(creationPromises);
        toast({ title: `${selectedBudgets.length} orçamentos criados com sucesso!`});
        setIsOpen(false);
    } catch(e) {
        console.error("Error creating budgets in batch", e);
        toast({ variant: 'destructive', title: 'Erro ao criar orçamentos.'});
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary"/> Orçamentos Sugeridos
          </DialogTitle>
          <DialogDescription>
            A IA analisou seus gastos e sugere os seguintes orçamentos. Selecione quais você quer criar.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-80 my-4">
          <div className="space-y-3 pr-4">
             {suggestedBudgets.map((budget, index) => {
                const isSelected = selectedBudgets.some(b => b.category === budget.category);
                return (
                    <div key={index} onClick={() => handleToggleSelection(budget)}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 border-primary/50" : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      {isSelected ? <CheckCircle className="h-5 w-5 text-primary"/> : <Circle className="h-5 w-5 text-muted-foreground"/>}
                      <div className="flex-1">
                        <p className="font-semibold">{budget.name}</p>
                        <p className="text-sm text-muted-foreground">{budget.category}</p>
                      </div>
                      <p className="font-bold text-lg">R$ {budget.amount.toFixed(2)}</p>
                    </div>
                )
             })}
          </div>
        </ScrollArea>
       
        <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleCreateBudgets} disabled={isSaving || selectedBudgets.length === 0}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar {selectedBudgets.length} Orçamentos
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
