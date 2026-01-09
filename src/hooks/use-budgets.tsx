// src/hooks/use-budgets.tsx
"use client";

import {
  useState,
  useMemo,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { Budget } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { useTransactions } from "./use-transactions";
import { apiClient } from "@/lib/api-client";
import { useDataRefresh } from "./use-data-refresh";

interface BudgetsContextType {
  budgets: Budget[];
  isLoading: boolean;
  isOnline: boolean;
  hasLoaded: boolean;
  loadBudgets: () => Promise<void>;
  addBudget: (
    budget: Omit<Budget, "id" | "createdAt" | "currentSpending" | "userId">
  ) => Promise<void>;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  refreshBudgets: () => Promise<void>;
}

const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { allTransactions } = useTransactions();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

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

  // Load budgets only when needed (lazy loading)
  const loadBudgets = useCallback(async () => {
    if (!user || hasLoaded) return;

    setIsLoading(true);
    try {
      const fetchedBudgets: Budget[] = await apiClient.get("budgets", user.uid);
      setBudgets(
        fetchedBudgets.map((b: Budget) => ({ ...b, currentSpending: 0 }))
      );
      setHasLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, hasLoaded]);

  // Force refresh (ignores hasLoaded)
  const refreshBudgetsInternal = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const fetchedBudgets: Budget[] = await apiClient.get("budgets", user.uid);
      setBudgets(
        fetchedBudgets.map((b: Budget) => ({ ...b, currentSpending: 0 }))
      );
      setHasLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Register refresh handler (but don't load immediately)
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setBudgets([]);
      setHasLoaded(false);
      return;
    }

    // Register this hook's refresh function with the global system
    registerRefreshHandler("budgets", refreshBudgetsInternal);

    return () => {
      unregisterRefreshHandler("budgets");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, authLoading]);

  const addBudget = async (
    budget: Omit<Budget, "id" | "createdAt" | "currentSpending" | "userId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    const budgetWithUser = {
      ...budget,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      currentSpending: 0,
    };

    try {
      const newBudget = await apiClient.create("budgets", budgetWithUser);
      setBudgets((prev) => [...prev, newBudget]);
      toast({ title: "Orçamento criado com sucesso!" });

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 500);
    } catch (error) {
      console.error("Erro ao adicionar orçamento:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar orçamento",
        description: "Tente novamente",
      });
    }
  };

  const updateBudget = async (budgetId: string, updates: Partial<Budget>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.update("budgets", budgetId, updates);
      setBudgets((prev) =>
        prev.map((b) => (b.id === budgetId ? { ...b, ...updates } : b))
      );
      toast({ title: "Orçamento atualizado!" });
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast({
        variant: "error",
        title: "Erro ao atualizar orçamento",
        description: "Tente novamente",
      });
    }
  };

  const deleteBudget = async (budgetId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.delete("budgets", budgetId);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
      toast({ title: "Orçamento excluído." });
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        variant: "error",
        title: "Erro ao excluir orçamento",
        description: "Tente novamente",
      });
    }
  };

  const refreshBudgets = async () => {
    await refreshBudgetsInternal();
  };

  // Calculate current spending for each budget
  const budgetsWithSpending = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    return budgets.map((budget) => {
      const spending = allTransactions
        .filter(
          (t) =>
            t.category === budget.category &&
            t.type === "expense" &&
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
    isOnline,
    hasLoaded,
    loadBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
    refreshBudgets,
  };

  return (
    <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}
