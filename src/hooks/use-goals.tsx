// src/hooks/use-goals.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { Goal, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";

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

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setGoals([]);
      return;
    }

    const loadGoals = async () => {
      setIsLoading(true);
      try {
        const fetchedGoals = await apiClient.get('goals', user.uid);
        setGoals(fetchedGoals);
      } catch (error) {
        console.error('Erro ao carregar metas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [user, authLoading]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    
    const goalWithUser = {
      ...goal,
      userId: user.uid,
      currentAmount: 0,
      createdAt: new Date().toISOString()
    };
    
    const newGoal = await apiClient.create('goals', goalWithUser);
    setGoals(prev => [...prev, newGoal]);
    toast({ title: "Meta criada com sucesso!" });
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) throw new Error("User not authenticated");
    
    await apiClient.update('goals', goalId, updates);
    setGoals(prev => 
      prev.map(g => g.id === goalId ? { ...g, ...updates } : g)
    );
    toast({ title: "Meta atualizada!" });
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    await apiClient.delete('goals', goalId);
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast({ title: "Meta excluída." });
  };

  const addDeposit = async (goalId: string, amount: number, walletId: string) => {
    if (!user) throw new Error("User not authenticated");
     
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

    // Create transaction
    await apiClient.create('transactions', { ...newTransaction, userId: user.uid });
    
    // Update goal amount
    await apiClient.update('goals', goalId, { 
      currentAmount: goal.currentAmount + amount 
    });
    
    // Update wallet balance  
    const wallet = await apiClient.get('wallets', user.uid, walletId);
    if (wallet) {
      await apiClient.update('wallets', walletId, { 
        balance: wallet.balance - amount 
      });
    }

    // Update local state
    setGoals(prev => 
      prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g)
    );

    toast({ title: `Depósito de R$ ${amount.toFixed(2)} adicionado!` });
  };

  const clearCompletedGoal = () => {
    setCompletedGoal(null);
  };

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
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalsProvider");
  }
  return context;
}
