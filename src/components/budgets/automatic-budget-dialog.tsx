// src/components/budgets/automatic-budget-dialog.tsx
'use client';

import { useState, useEffect } from "react";
import { z } from "zod";
import { TransactionCategory } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { useToast } from "@/hooks/use-toast";
import { useBudgets } from "@/hooks/use-budgets";
import { Sparkles, CheckCircle, Circle } from "lucide-react";
import { BudgetItemSchema } from "@/ai/ai-types";

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

  const theme = useTheme();

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }}/> 
          Orçamentos Sugeridos
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          A IA analisou seus gastos e sugere os seguintes orçamentos. Selecione quais você quer criar.
        </Typography>
        
        <Box sx={{ maxHeight: '20rem', overflowY: 'auto', pr: 1 }}>
          <Stack spacing={2}>
             {suggestedBudgets.map((budget, index) => {
                const isSelected = selectedBudgets.some(b => b.category === budget.category);
                return (
                    <Stack key={index} onClick={() => handleToggleSelection(budget)}
                      direction="row" alignItems="center" spacing={2}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderColor: isSelected ? alpha(theme.palette.primary.main, 0.5) : 'divider',
                        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                        '&:hover': { 
                            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'action.hover' 
                        }
                      }}
                    >
                      {isSelected ? 
                        <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }}/> : 
                        <Circle style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.text.secondary }}/>
                      }
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{budget.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{budget.category}</Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold">R$ {budget.amount.toFixed(2)}</Typography>
                    </Stack>
                )
             })}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setIsOpen(false)} disabled={isSaving} color="inherit">Cancelar</Button>
          <Button 
            variant="contained"
            onClick={handleCreateBudgets} 
            disabled={isSaving || selectedBudgets.length === 0}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
          >
              {isSaving ? 'Criando...' : `Criar ${selectedBudgets.length} Orçamentos`}
          </Button>
      </DialogActions>
    </Dialog>
  );
}
