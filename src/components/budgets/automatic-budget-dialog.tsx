// src/components/budgets/automatic-budget-dialog.tsx
'use client';

import { useState, useEffect } from "react";
import { z } from "zod";
import { TransactionCategory } from "@/lib/types";
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
import { useBudgets } from "@/hooks/use-budgets";
import { Loader2, Sparkles, CheckCircle, Circle } from "lucide-react";
import { BudgetItemSchema } from "@/ai/ai-types";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Box, Stack, Typography } from '@mui/material';

type SuggestedBudget = z.infer<typeof BudgetItemSchema>;

interface AutomaticBudgetDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  suggestedBudgets: SuggestedBudget[];
}

export function AutomaticBudgetDialog({ isOpen, setIsOpen, suggestedBudgets }: AutomaticBudgetDialogProps) {
  const { toast } = useToast();
  const { addBudget, isLoading: isSaving } = useBudgets();
  const [selectedBudgets, setSelectedBudgets] = useState<SuggestedBudget[]>([]);

  // Sync state when suggestions change and dialog opens
  useEffect(() => {
    if (isOpen) {
        setSelectedBudgets(suggestedBudgets);
    }
  }, [isOpen, suggestedBudgets]);

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
                category: b.category as TransactionCategory,
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
      <DialogContent sx={{ maxWidth: '28rem' }}>
        <DialogHeader>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Sparkles style={{ color: 'var(--primary)' }}/> Orçamentos Sugeridos
            </Stack>
          </DialogTitle>
          <DialogDescription>
            A IA analisou seus gastos e sugere os seguintes orçamentos. Selecione quais você quer criar.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea sx={{ maxHeight: '20rem', my: 4 }}>
          <Stack spacing={3} sx={{ pr: 4 }}>
             {suggestedBudgets.map((budget, index) => {
                const isSelected = selectedBudgets.some(b => b.category === budget.category);
                return (
                    <Stack key={index} onClick={() => handleToggleSelection(budget)}
                      direction="row" alignItems="center" spacing={4}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: 1,
                        cursor: 'pointer',
                        transition: 'colors 0.2s',
                        ...(isSelected ? {
                          bgcolor: 'rgba(var(--primary-rgb), 0.1)',
                          borderColor: 'rgba(var(--primary-rgb), 0.5)'
                        } : {
                          bgcolor: 'rgba(var(--muted-rgb), 0.5)',
                          '&:hover': { bgcolor: 'action.hover' }
                        })
                      }}
                    >
                      {isSelected ? <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }}/> : <Circle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--muted-foreground)' }}/>}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{budget.name}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{budget.category}</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>R$ {budget.amount.toFixed(2)}</Typography>
                    </Stack>
                )
             })}
          </Stack>
        </ScrollArea>
       
        <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleCreateBudgets} disabled={isSaving || selectedBudgets.length === 0}>
                {isSaving && <Loader2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} className="animate-spin" />}
                Criar {selectedBudgets.length} Orçamentos
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
