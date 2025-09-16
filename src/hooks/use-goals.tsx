// src/hooks/use-goals.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { Goal, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { offlineStorage } from "@/lib/offline-storage";
import { getSmartGoalPrediction } from "@/services/ai-automation-service";

interface GoalsContextType {
  goals: Goal[];
  isLoading: boolean;
  isOnline: boolean;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'userId'>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addDeposit: (goalId: string, amount: number, walletId: string) => Promise<void>;
  completedGoal: Goal | null;
  clearCompletedGoal: () => void;
  refreshGoals: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const prevGoalsRef = useRef<Goal[]>([]);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

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

  const loadGoals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let fetchedGoals: Goal[];

      if (navigator.onLine) {
        // Online: fetch from server and sync to offline storage
        fetchedGoals = await apiClient.get('goals', user.uid);
        
        // Save to offline storage
        for (const goal of fetchedGoals) {
          await offlineStorage.saveGoal(goal, true);
        }
      } else {
        // Offline: load from offline storage
        fetchedGoals = await offlineStorage.getGoals(user.uid);
      }

      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      // Try to load from offline storage as fallback
      try {
        const offlineGoals = await offlineStorage.getGoals(user.uid);
        setGoals(offlineGoals);
      } catch (offlineError) {
        console.error('Erro ao carregar metas offline:', offlineError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setGoals([]);
      return;
    }

    loadGoals();
  }, [user, authLoading]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    
    const goalWithUser = {
      ...goal,
      userId: user.uid,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      id: `temp-${Date.now()}-${Math.random()}` // Temporary ID for offline
    };
    
    try {
      if (navigator.onLine) {
        // Online: create on server
        const newGoal = await apiClient.create('goals', goalWithUser);
        await offlineStorage.saveGoal(newGoal, true);
        setGoals(prev => [...prev, newGoal]);
        toast({ title: "Meta criada com sucesso!" });
      } else {
        // Offline: save locally and mark for sync
        await offlineStorage.saveGoal(goalWithUser, false);
        await offlineStorage.addPendingAction({
          type: 'create',
          collection: 'goals',
          data: goalWithUser
        });
        
        setGoals(prev => [...prev, goalWithUser]);
        toast({
          title: "💾 Meta salva offline",
          description: "Será sincronizada quando você estiver online"
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar meta",
        description: "Tente novamente"
      });
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      if (navigator.onLine) {
        // Online: update on server
        await apiClient.update('goals', goalId, updates);
        const updatedGoal = goals.find(g => g.id === goalId);
        if (updatedGoal) {
          const finalGoal = { ...updatedGoal, ...updates };
          await offlineStorage.saveGoal(finalGoal, true);
        }
        toast({ title: "Meta atualizada!" });
      } else {
        // Offline: update locally and mark for sync
        const updatedGoal = goals.find(g => g.id === goalId);
        if (updatedGoal) {
          const finalGoal = { ...updatedGoal, ...updates };
          await offlineStorage.saveGoal(finalGoal, false);
          await offlineStorage.addPendingAction({
            type: 'update',
            collection: 'goals',
            data: { id: goalId, ...updates }
          });
        }
        
        toast({
          title: "💾 Meta atualizada offline",
          description: "Será sincronizada quando você estiver online"
        });
      }
      
      setGoals(prev => 
        prev.map(g => g.id === goalId ? { ...g, ...updates } : g)
      );
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar meta",
        description: "Tente novamente"
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      if (navigator.onLine) {
        // Online: delete on server
        await apiClient.delete('goals', goalId);
        await offlineStorage.deleteItem('goals', goalId);
        toast({ title: "Meta excluída." });
      } else {
        // Offline: mark as deleted locally and queue for sync
        const goalToDelete = goals.find(g => g.id === goalId);
        if (goalToDelete) {
          await offlineStorage.deleteItem('goals', goalId);
          await offlineStorage.addPendingAction({
            type: 'delete',
            collection: 'goals',
            data: goalToDelete
          });
        }
        
        toast({
          title: "💾 Meta excluída offline",
          description: "Será sincronizada quando você estiver online"
        });
      }
      
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir meta",
        description: "Tente novamente"
      });
    }
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

    try {
      if (navigator.onLine) {
        // Online: create transaction and update goal/wallet
        await apiClient.create('transactions', { ...newTransaction, userId: user.uid });
        
        const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
        await apiClient.update('goals', goalId, { 
          currentAmount: updatedGoal.currentAmount 
        });
        
        const wallet = await apiClient.get('wallets', user.uid, walletId);
        if (wallet) {
          await apiClient.update('wallets', walletId, { 
            balance: wallet.balance - amount 
          });
        }

        // Generate AI prediction (only when online)
        try {
          const userTransactions = await apiClient.get('transactions', user.uid);
          const transactionsJson = JSON.stringify(userTransactions, null, 2);
          
          await getSmartGoalPrediction(goalId, {
            goalName: updatedGoal.name,
            targetAmount: updatedGoal.targetAmount,
            currentAmount: updatedGoal.currentAmount,
            targetDate: updatedGoal.targetDate,
            monthlyDeposit: updatedGoal.monthlyDeposit,
            transactions: transactionsJson,
          }, user.uid);
        } catch (error) {
          console.log('Erro ao gerar previsão de meta:', error);
        }

        toast({ title: `Depósito de R$ ${amount.toFixed(2)} adicionado!` });
      } else {
        // Offline: queue all operations for sync
        await offlineStorage.addPendingAction({
          type: 'create',
          collection: 'transactions',
          data: { ...newTransaction, userId: user.uid, id: `temp-${Date.now()}-${Math.random()}` }
        });

        await offlineStorage.addPendingAction({
          type: 'update',
          collection: 'goals',
          data: { id: goalId, currentAmount: goal.currentAmount + amount }
        });

        await offlineStorage.addPendingAction({
          type: 'update',
          collection: 'wallets', 
          data: { id: walletId, balanceChange: -amount }
        });

        toast({
          title: "💾 Depósito salvo offline",
          description: `R$ ${amount.toFixed(2)} será processado quando você estiver online`
        });
      }

      // Update local state
      setGoals(prev => 
        prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g)
      );

    } catch (error) {
      console.error('Erro ao adicionar depósito:', error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar depósito",
        description: "Tente novamente"
      });
    }
  };

  const refreshGoals = async () => {
    await loadGoals();
  };

  const clearCompletedGoal = () => {
    setCompletedGoal(null);
  };

  const value: GoalsContextType = {
    goals,
    isLoading: isLoading || authLoading,
    isOnline,
    addGoal,
    updateGoal,
    deleteGoal,
    addDeposit,
    completedGoal,
    clearCompletedGoal,
    refreshGoals,
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
