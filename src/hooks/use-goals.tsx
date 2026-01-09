// src/hooks/use-goals.tsx
"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useRef,
} from "react";
import { Goal, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { useDataRefresh } from "./use-data-refresh";

interface GoalsContextType {
  goals: Goal[];
  isLoading: boolean;
  isOnline: boolean;
  addGoal: (
    goal: Omit<Goal, "id" | "createdAt" | "currentAmount" | "userId">
  ) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addDeposit: (
    goalId: string,
    amount: number,
    walletId: string
  ) => Promise<void>;
  completedGoal: Goal | null;
  clearCompletedGoal: () => void;
  refreshGoals: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();
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

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Effect to check for newly completed goals
  useEffect(() => {
    const justCompleted = goals.find((currentGoal) => {
      const prevGoal = prevGoalsRef.current.find(
        (pg) => pg.id === currentGoal.id
      );
      return (
        currentGoal.currentAmount >= currentGoal.targetAmount &&
        prevGoal &&
        prevGoal.currentAmount < prevGoal.targetAmount
      );
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
      const fetchedGoals: Goal[] = await apiClient.get("goals", user.uid);
      setGoals(fetchedGoals);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      setGoals([]);
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

    // Register this hook's refresh function with the global system
    registerRefreshHandler("goals", loadGoals);

    return () => {
      unregisterRefreshHandler("goals");
    };
  }, [user, authLoading]);

  const addGoal = async (
    goal: Omit<Goal, "id" | "createdAt" | "currentAmount" | "userId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    const goalWithUser = {
      ...goal,
      userId: user.uid,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const newGoal = await apiClient.create("goals", goalWithUser);
      setGoals((prev) => [...prev, newGoal]);
      toast({ title: "Meta criada com sucesso!" });
      triggerRefresh();

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 500);
    } catch (error) {
      console.error("Erro ao adicionar meta:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar meta",
        description: "Tente novamente",
      });
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.update("goals", goalId, updates);
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
      );
      toast({ title: "Meta atualizada!" });
      triggerRefresh();
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      toast({
        variant: "error",
        title: "Erro ao atualizar meta",
        description: "Tente novamente",
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.delete("goals", goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      toast({ title: "Meta excluída." });
      triggerRefresh();
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      toast({
        variant: "error",
        title: "Erro ao excluir meta",
        description: "Tente novamente",
      });
    }
  };

  const addDeposit = async (
    goalId: string,
    amount: number,
    walletId: string
  ) => {
    if (!user) throw new Error("User not authenticated");

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) throw new Error("Meta não encontrada.");

    const newTransaction: Omit<Transaction, "id" | "userId"> = {
      item: `Depósito para Meta: ${goal.name}`,
      amount: amount,
      date: new Date().toISOString(),
      category: "Transferência",
      type: "transfer",
      walletId: walletId,
      toWalletId: goalId, // Using goalId to signify transfer to goal
    };

    try {
      // Create transaction and update goal/wallet
      await apiClient.create("transactions", {
        ...newTransaction,
        userId: user.uid,
      });

      const updatedGoal = {
        ...goal,
        currentAmount: goal.currentAmount + amount,
      };
      await apiClient.update("goals", goalId, {
        currentAmount: updatedGoal.currentAmount,
      });

      const wallet = await apiClient.get("wallets", user.uid, walletId);
      if (wallet) {
        await apiClient.update("wallets", walletId, {
          balance: wallet.balance - amount,
        });
      }

      // Update local state
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, currentAmount: g.currentAmount + amount }
            : g
        )
      );

      toast({ title: `Depósito de R$ ${amount.toFixed(2)} adicionado!` });
      triggerRefresh();
    } catch (error) {
      console.error("Erro ao adicionar depósito:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar depósito",
        description: "Tente novamente",
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
    <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalsProvider");
  }
  return context;
}
