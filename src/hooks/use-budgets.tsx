// src/hooks/use-budgets.tsx
"use client";

import {
  useState,
  useMemo,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { Budget } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { useTransactions } from "./use-transactions";
import { apiClient } from "@/lib/api-client";
import { offlineStorage } from "@/lib/offline-storage";
import { useDataRefresh } from "./use-data-refresh";

interface BudgetsContextType {
  budgets: Budget[];
  isLoading: boolean;
  isOnline: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

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

  const loadBudgets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let fetchedBudgets: Budget[];

      if (navigator.onLine) {
        // Online: fetch from server and sync to offline storage
        fetchedBudgets = await apiClient.get("budgets", user.uid);

        // Save to offline storage
        for (const budget of fetchedBudgets) {
          await offlineStorage.saveBudget(budget, true);
        }
      } else {
        // Offline: load from offline storage
        fetchedBudgets = await offlineStorage.getBudgets(user.uid);
      }

      setBudgets(
        fetchedBudgets.map((b: Budget) => ({ ...b, currentSpending: 0 }))
      );
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
      // Try to load from offline storage as fallback
      try {
        const offlineBudgets = await offlineStorage.getBudgets(user.uid);
        setBudgets(
          offlineBudgets.map((b: Budget) => ({ ...b, currentSpending: 0 }))
        );
      } catch (offlineError) {
        console.error("Erro ao carregar orçamentos offline:", offlineError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setBudgets([]);
      return;
    }

    loadBudgets();

    // Register this hook's refresh function with the global system
    registerRefreshHandler("budgets", loadBudgets);

    return () => {
      unregisterRefreshHandler("budgets");
    };
  }, [user, authLoading]);

  const addBudget = async (
    budget: Omit<Budget, "id" | "createdAt" | "currentSpending" | "userId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    const budgetWithUser = {
      ...budget,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      currentSpending: 0,
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for offline
    };

    try {
      if (navigator.onLine) {
        // Online: create on server
        const newBudget = await apiClient.create("budgets", budgetWithUser);
        await offlineStorage.saveBudget(newBudget, true);
        setBudgets((prev) => [...prev, newBudget]);
        toast({ title: "Orçamento criado com sucesso!" });

        // Trigger global refresh to update other pages/components
        setTimeout(() => {
          triggerRefresh("all");
        }, 500);
      } else {
        // Offline: save locally and mark for sync
        await offlineStorage.saveBudget(budgetWithUser, false);
        await offlineStorage.addPendingAction({
          type: "create",
          collection: "budgets",
          data: budgetWithUser,
        });

        setBudgets((prev) => [...prev, budgetWithUser]);
        toast({
          title: "💾 Orçamento salvo offline",
          description: "Será sincronizado quando você estiver online",
        });

        // Trigger global refresh to update other pages/components
        setTimeout(() => {
          triggerRefresh("all");
        }, 500);
      }
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
      if (navigator.onLine) {
        // Online: update on server
        await apiClient.update("budgets", budgetId, updates);
        const updatedBudget = budgets.find((b) => b.id === budgetId);
        if (updatedBudget) {
          const finalBudget = { ...updatedBudget, ...updates };
          await offlineStorage.saveBudget(finalBudget, true);
        }
        toast({ title: "Orçamento atualizado!" });
      } else {
        // Offline: update locally and mark for sync
        const updatedBudget = budgets.find((b) => b.id === budgetId);
        if (updatedBudget) {
          const finalBudget = { ...updatedBudget, ...updates };
          await offlineStorage.saveBudget(finalBudget, false);
          await offlineStorage.addPendingAction({
            type: "update",
            collection: "budgets",
            data: { id: budgetId, ...updates },
          });
        }

        toast({
          title: "💾 Orçamento atualizado offline",
          description: "Será sincronizado quando você estiver online",
        });
      }

      setBudgets((prev) =>
        prev.map((b) => (b.id === budgetId ? { ...b, ...updates } : b))
      );
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
      if (navigator.onLine) {
        // Online: delete on server
        await apiClient.delete("budgets", budgetId);
        await offlineStorage.deleteItem("budgets", budgetId, user.uid);
        toast({ title: "Orçamento excluído." });
      } else {
        // Offline: mark as deleted locally and queue for sync
        const budgetToDelete = budgets.find((b) => b.id === budgetId);
        if (budgetToDelete) {
          await offlineStorage.deleteItem("budgets", budgetId, user.uid);
          await offlineStorage.addPendingAction({
            type: "delete",
            collection: "budgets",
            data: budgetToDelete,
          });
        }

        toast({
          title: "💾 Orçamento excluído offline",
          description: "Será sincronizado quando você estiver online",
        });
      }

      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
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
    await loadBudgets();
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
