// src/hooks/use-budgets.tsx
'use client';

import { useState, useMemo, useEffect, createContext, useContext, ReactNode } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { Budget } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { useTransactions } from "./use-transactions";
import { apiClient } from "@/lib/api-client";

interface BudgetsContextType {
  budgets: Budget[];
  isLoading: boolean;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'currentSpending' | 'userId'>) => Promise<void>;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
}

const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { allTransactions } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setBudgets([]);
      return;
    }

    const loadBudgets = async () => {
      setIsLoading(true);
      try {
        const fetchedBudgets = await apiClient.get('budgets', user.uid);
        setBudgets(fetchedBudgets.map((b: Budget) => ({ ...b, currentSpending: 0 })));
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgets();
  }, [user, authLoading]);

  const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'currentSpending' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    
    const budgetWithUser = {
      ...budget,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      currentSpending: 0
    };
    
    const newBudget = await apiClient.create('budgets', budgetWithUser);
    setBudgets(prev => [...prev, newBudget]);
    toast({ title: "Orçamento criado com sucesso!" });
  };

  const updateBudget = async (budgetId: string, updates: Partial<Budget>) => {
    if (!user) throw new Error("User not authenticated");
    
    await apiClient.update('budgets', budgetId, updates);
    setBudgets(prev => 
      prev.map(b => b.id === budgetId ? { ...b, ...updates } : b)
    );
    toast({ title: "Orçamento atualizado!" });
  };

  const deleteBudget = async (budgetId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    await apiClient.delete('budgets', budgetId);
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
    toast({ title: "Orçamento excluído." });
  };

  // Calculate current spending for each budget
  const budgetsWithSpending = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    
    return budgets.map(budget => {
      const spending = allTransactions
        .filter(t => 
          t.category === budget.category &&
          t.type === 'expense' &&
          new Date(t.date) >= currentMonthStart &&
          new Date(t.date) <= currentMonthEnd
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, currentSpending: spending };
    });
  }, [budgets, allTransactions]);

  const value: BudgetsContextType = {
    budgets: budgetsWithSpending,
    isLoading: isLoading || authLoading,
    addBudget,
    updateBudget,
    deleteBudget,
  };

  return (
    <BudgetsContext.Provider value={value}>
      {children}
    </BudgetsContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}
