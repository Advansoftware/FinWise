// src/hooks/use-goals.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { Goal, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";

interface GoalsContextType {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addDeposit: (goalId: string, amount: number, walletId: string) => Promise<void>;
  completedGoal: Goal | null;
  clearCompletedGoal: () => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const prevGoalsRef = useRef<Goal[]>([]);
  const dbAdapter = getDatabaseAdapter();


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
    if (!user) {
      setIsLoading(false);
      setGoals([]);
      return () => {};
    }

    setIsLoading(true);

    const constraints = (dbAdapter.constructor.name === 'FirebaseAdapter')
      ? [dbAdapter.queryConstraint('orderBy', 'createdAt', 'desc')]
      : [];

    const unsubscribe = dbAdapter.listenToCollection<Goal>(
      'users/USER_ID/goals',
      (fetchedGoals) => {
        setGoals(fetchedGoals);
        setIsLoading(false);
      },
      constraints
    );
    
    return () => unsubscribe();
  }, [user, dbAdapter]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.addDoc('users/USER_ID/goals', {
        ...goal,
        currentAmount: 0,
        createdAt: new Date()
    });
    toast({ title: "Meta criada com sucesso!" });
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.updateDoc(`users/USER_ID/goals/${goalId}`, updates);
    toast({ title: "Meta atualizada!" });
  }

  const deleteGoal = async (goalId: string) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.deleteDoc(`users/USER_ID/goals/${goalId}`);
    toast({ title: "Meta excluída." });
  }

  const addDeposit = async (goalId: string, amount: number, walletId: string) => {
     if (!user) throw new Error("User not authenticated");
     
     await dbAdapter.runTransaction(async (transaction) => {
        const goalDoc = await transaction.get(`users/USER_ID/goals/${goalId}`);
        if (!goalDoc || !goalDoc.data()) throw new Error("Meta não encontrada.");

        const newTransaction: Omit<Transaction, 'id'> = {
            item: `Depósito para Meta: ${goalDoc.data().name}`,
            amount: amount,
            date: new Date().toISOString(),
            category: "Transferência",
            type: 'transfer',
            walletId: walletId,
        };
        await transaction.set(`users/USER_ID/transactions/${Date.now()}`, newTransaction);

        transaction.update(`users/USER_ID/wallets/${walletId}`, { balance: dbAdapter.increment(-amount) });
        transaction.update(`users/USER_ID/goals/${goalId}`, { currentAmount: dbAdapter.increment(amount) });
     });

     toast({ title: `Depósito de R$ ${amount.toFixed(2)} adicionado!`})
  }

  const clearCompletedGoal = () => {
    setCompletedGoal(null);
  }

  const value: GoalsContextType = {
    goals,
    isLoading,
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
