// src/hooks/use-budgets.tsx
'use client';

import { useState, useMemo, useEffect, createContext, useContext, ReactNode } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { Budget } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { useTransactions } from "./use-transactions";
import { getDatabaseAdapter } from "@/services/database/database-service";
import { orderBy } from "firebase/firestore";

interface BudgetsContextType {
  budgets: Budget[];
  isLoading: boolean;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'currentSpending'>) => Promise<void>;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
}

const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { allTransactions } = useTransactions();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dbAdapter = getDatabaseAdapter();

  // Listener for budgets
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setBudgets([]);
      return () => {};
    }

    setIsLoading(true);
    const unsubscribe = dbAdapter.listenToCollection<Budget>(
      'users/USER_ID/budgets',
      (fetchedBudgets) => {
        setBudgets(fetchedBudgets.map(b => ({ ...b, currentSpending: 0 })));
        setIsLoading(false);
      },
      // This is Firestore specific, so we pass it carefully.
      // A more abstract query system might be needed for full DB independence.
      // For now, we assume other adapters might ignore it.
      (dbAdapter.constructor.name === 'FirebaseAdapter' ? [orderBy("createdAt", "desc")] : [])
    );

    return () => unsubscribe();
  }, [user, dbAdapter]);

  const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'currentSpending'>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.addDoc('users/USER_ID/budgets', {
        ...budget,
        createdAt: new Date()
    });
    toast({ title: "Orçamento criado com sucesso!" });
  }

  const updateBudget = async (budgetId: string, updates: Partial<Budget>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.updateDoc(`users/USER_ID/budgets/${budgetId}`, updates);
    toast({ title: "Orçamento atualizado!" });
  }

  const deleteBudget = async (budgetId: string) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.deleteDoc(`users/USER_ID/budgets/${budgetId}`);
    toast({ title: "Orçamento excluído." });
  }

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
    isLoading,
    addBudget,
    updateBudget,
    deleteBudget,
  };

  return (
    <BudgetsContext.Provider value={value}>
        {children}
    </BudgetsContext.Provider>
  )
}

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}
