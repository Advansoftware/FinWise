// src/hooks/use-goals.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef, useMemo } from "react";
import { Goal, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";

interface GoalsContextType {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'userId'>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addDeposit: (goalId: string, amount: number, walletId: string) => Promise<void>;
  completedGoal: Goal | null;
  clearCompletedGoal: () => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const prevGoalsRef = useRef<Goal[]>([]);
  const dbAdapter = useMemo(() => getDatabaseAdapter(), []);


  // Effect to check for newly completed goals
  useEffect(() => {
    const justCompleted = goals.find(currentGoal => {
        const prevGoal = prevGoalsRef.current.find(pg => pg.id === currentGoal.id);
        return currentGoal.currentAmount >= currentGoal.targetAmount && prevGoal && prevGoal.currentAmount < prevGoal.targetAmount;
    });

    if (justCompleted) {
        setCompletedGoal(justCompleted);
    }

    prevGoalsRef.current = goals;
  }, [goals]);


  // Listener for goals
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setGoals([]);
      return;
    }

    setIsLoading(true);

    const unsubscribe = dbAdapter.listenToCollection<Goal>(
      `goals`,
      (fetchedGoals) => {
        setGoals(fetchedGoals);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user, authLoading, dbAdapter]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.addDoc(`goals`, {
        ...goal,
        userId: user.uid,
        currentAmount: 0,
        createdAt: new Date().toISOString()
    });
    toast({ title: "Meta criada com sucesso!" });
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.updateDoc(`goals/${goalId}`, updates);
    toast({ title: "Meta atualizada!" });
  }

  const deleteGoal = async (goalId: string) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.deleteDoc(`goals/${goalId}`);
    toast({ title: "Meta excluída." });
  }

  const addDeposit = async (goalId: string, amount: number, walletId: string) => {
     if (!user) throw new Error("User not authenticated");
     
     // This would need to be a transactional API endpoint in a real MongoDB setup
     // For now, we simulate the client-side orchestration.
     const goal = goals.find(g => g.id === goalId);
     if (!goal) throw new Error("Meta não encontrada.");

     const newTransaction: Omit<Transaction, 'id' | 'userId'> = {
         item: `Depósito para Meta: ${goal.name}`,
         amount: amount,
         date: new Date().toISOString(),
         category: "Transferência",
         type: 'transfer',
         walletId: walletId,
         toWalletId: goalId, // Using goalId to signify transfer to goal
     };

     await dbAdapter.addDoc('transactions', { ...newTransaction, userId: user.uid });
     await dbAdapter.updateDoc(`goals/${goalId}`, { currentAmount: dbAdapter.increment(amount) });
     await dbAdapter.updateDoc(`wallets/${walletId}`, { balance: dbAdapter.increment(-amount) });


     toast({ title: `Depósito de R$ ${amount.toFixed(2)} adicionado!`})
  }

  const clearCompletedGoal = () => {
    setCompletedGoal(null);
  }

  const value: GoalsContextType = {
    goals,
    isLoading: isLoading || authLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    addDeposit,
    completedGoal,
    clearCompletedGoal,
  };

  return (
    <GoalsContext.Provider value={value}>
        {children}
    </GoalsContext.Provider>
  )
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalsProvider");
  }
  return context;
}
