// src/hooks/use-transactions.tsx
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
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";
import { Transaction, TransactionCategory, Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { useWallets } from "./use-wallets";
import { offlineStorage } from "@/lib/offline-storage";
import { useDataRefresh } from "./use-data-refresh";

interface TransactionsProviderProps {
  children: ReactNode;
}

type CategoryMap = Partial<Record<TransactionCategory, string[]>>;

interface TransactionsContextType {
  allTransactions: Transaction[];
  isLoading: boolean;
  filteredTransactions: Transaction[];
  chartData: { name: string; total: number }[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  categories: TransactionCategory[];
  subcategories: CategoryMap;
  selectedCategory: string;
  handleCategoryChange: (category: string) => void;
  availableSubcategories: string[];
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategory: string) => void;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "userId">
  ) => Promise<void>;
  addGroupedTransaction: (
    parent: Omit<Transaction, "id" | "userId">,
    children: Omit<Transaction, "id" | "userId" | "parentId">[]
  ) => Promise<void>;
  getChildTransactions: (parentId: string) => Promise<Transaction[]>;
  addChildTransaction: (
    parentId: string,
    child: Omit<Transaction, "id" | "userId" | "parentId">
  ) => Promise<void>;
  updateChildTransaction: (
    parentId: string,
    childId: string,
    updates: Partial<Transaction>
  ) => Promise<void>;
  deleteChildTransaction: (parentId: string, childId: string) => Promise<void>;
  updateTransaction: (
    transactionId: string,
    updates: Partial<Transaction>,
    originalTransaction: Transaction
  ) => Promise<void>;
  deleteTransaction: (transaction: Transaction) => Promise<void>;
  addCategory: (categoryName: TransactionCategory) => Promise<void>;
  deleteCategory: (categoryName: TransactionCategory) => Promise<void>;
  addSubcategory: (
    categoryName: TransactionCategory,
    subcategoryName: string
  ) => Promise<void>;
  deleteSubcategory: (
    categoryName: TransactionCategory,
    subcategoryName: string
  ) => Promise<void>;
  isOnline: boolean;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(
  undefined
);

export function TransactionsProvider({ children }: TransactionsProviderProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { refreshWallets } = useWallets();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

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

  const refreshData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let fetchedTransactions: Transaction[];
      let settings: any;

      if (navigator.onLine) {
        // Online: fetch from server and sync to offline storage
        [fetchedTransactions, settings] = await Promise.all([
          apiClient.get("transactions", user.uid),
          apiClient.get("settings", user.uid),
        ]);

        // Save to offline storage
        for (const transaction of fetchedTransactions) {
          await offlineStorage.saveTransaction(transaction, true);
        }

        if (settings) {
          await offlineStorage.saveSetting(
            "categories",
            settings.categories || {}
          );
        }
      } else {
        // Offline: load from offline storage
        fetchedTransactions = await offlineStorage.getTransactions(user.uid);
        const categoriesFromStorage = await offlineStorage.getSetting(
          "categories"
        );
        settings = { categories: categoriesFromStorage || {} };
      }

      setAllTransactions(fetchedTransactions);
      setCategoryMap(settings?.categories || {});
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Try to load from offline storage as fallback
      try {
        const offlineTransactions = await offlineStorage.getTransactions(
          user.uid
        );
        const offlineCategories = await offlineStorage.getSetting("categories");
        setAllTransactions(offlineTransactions);
        setCategoryMap(offlineCategories || {});
      } catch (offlineError) {
        console.error("Erro ao carregar dados offline:", offlineError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setAllTransactions([]);
      setCategoryMap({});
      return;
    }

    refreshData();

    // Register this hook's refresh function with the global system
    registerRefreshHandler("transactions", refreshData);

    return () => {
      unregisterRefreshHandler("transactions");
    };
  }, [user?.uid, authLoading]);

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "userId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    const transactionWithUser = {
      ...transaction,
      userId: user.uid,
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for offline
    };

    try {
      if (navigator.onLine) {
        // Online: create on server
        const created = await apiClient.create(
          "transactions",
          transactionWithUser
        );
        await offlineStorage.saveTransaction(created, true);
      } else {
        // Offline: save locally and mark for sync
        await offlineStorage.saveTransaction(transactionWithUser, false);
        await offlineStorage.addPendingAction({
          type: "create",
          collection: "transactions",
          data: transactionWithUser,
        });

        toast({
          title: "💾 Transação salva offline",
          description: "Será sincronizada quando você estiver online",
        });
      }

      await refreshData();
      // Add a small delay to ensure balance update is processed on server
      setTimeout(() => {
        refreshWallets();
      }, 500);

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 1000);
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar transação",
        description: "Tente novamente",
      });
    }
  };

  // Adiciona uma transação agrupada (pai + filhos)
  const addGroupedTransaction = async (
    parent: Omit<Transaction, "id" | "userId">,
    children: Omit<Transaction, "id" | "userId" | "parentId">[]
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      if (navigator.onLine) {
        // Online: create on server
        const created = await apiClient.create("transactions/grouped", {
          parent: { ...parent, userId: user.uid },
          children: children.map((c) => ({ ...c, userId: user.uid })),
        });
        await offlineStorage.saveTransaction(created, true);
      } else {
        // Offline: save parent locally with temp IDs
        const tempParentId = `temp-${Date.now()}-${Math.random()}`;
        const parentWithUser = {
          ...parent,
          userId: user.uid,
          id: tempParentId,
          hasChildren: true,
          childrenCount: children.length,
        };

        await offlineStorage.saveTransaction(parentWithUser, false);

        // Save children with parent reference
        for (const child of children) {
          const childWithUser = {
            ...child,
            userId: user.uid,
            id: `temp-${Date.now()}-${Math.random()}`,
            parentId: tempParentId,
          };
          await offlineStorage.saveTransaction(childWithUser, false);
        }

        await offlineStorage.addPendingAction({
          type: "create",
          collection: "transactions/grouped",
          data: {
            parent: { ...parent, userId: user.uid },
            children: children.map((c) => ({ ...c, userId: user.uid })),
          },
        });

        toast({
          title: "💾 Transação agrupada salva offline",
          description: "Será sincronizada quando você estiver online",
        });
      }

      await refreshData();
      setTimeout(() => {
        refreshWallets();
      }, 500);

      setTimeout(() => {
        triggerRefresh("all");
      }, 1000);
    } catch (error) {
      console.error("Erro ao adicionar transação agrupada:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar transação",
        description: "Tente novamente",
      });
    }
  };

  // Busca transações filhas de uma transação pai
  const getChildTransactions = async (
    parentId: string
  ): Promise<Transaction[]> => {
    if (!user) throw new Error("User not authenticated");

    try {
      if (navigator.onLine) {
        const children = await apiClient.get(
          `transactions/${parentId}/children`,
          user.uid
        );
        return children || [];
      } else {
        // Offline: busca do storage local
        const allTx = await offlineStorage.getTransactions(user.uid);
        return allTx.filter((t) => t.parentId === parentId);
      }
    } catch (error) {
      console.error("Erro ao buscar transações filhas:", error);
      return [];
    }
  };

  // Adiciona uma transação filha a um pai existente
  const addChildTransaction = async (
    parentId: string,
    child: Omit<Transaction, "id" | "userId" | "parentId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      if (navigator.onLine) {
        await apiClient.create(`transactions/${parentId}/children`, {
          ...child,
          userId: user.uid,
          parentId,
        });
      } else {
        const childWithUser = {
          ...child,
          userId: user.uid,
          id: `temp-${Date.now()}-${Math.random()}`,
          parentId,
        };
        await offlineStorage.saveTransaction(childWithUser, false);
        await offlineStorage.addPendingAction({
          type: "create",
          collection: `transactions/${parentId}/children`,
          data: childWithUser,
        });

        toast({
          title: "💾 Item salvo offline",
          description: "Será sincronizado quando você estiver online",
        });
      }

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      throw error;
    }
  };

  // Atualiza uma transação filha
  const updateChildTransaction = async (
    parentId: string,
    childId: string,
    updates: Partial<Transaction>
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      if (navigator.onLine) {
        await apiClient.update(`transactions/${parentId}/children`, childId, {
          updates,
          userId: user.uid,
        });
      } else {
        toast({
          title: "💾 Item atualizado offline",
          description: "Será sincronizado quando você estiver online",
        });
      }

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      throw error;
    }
  };

  // Remove uma transação filha
  const deleteChildTransaction = async (parentId: string, childId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      if (navigator.onLine) {
        await apiClient.delete(`transactions/${parentId}/children`, childId, {
          userId: user.uid,
        });
      } else {
        await offlineStorage.deleteItem("transactions", childId, user.uid);
        toast({
          title: "💾 Item removido offline",
          description: "Será sincronizado quando você estiver online",
        });
      }

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
    } catch (error) {
      console.error("Erro ao remover item:", error);
      throw error;
    }
  };

  const updateTransaction = async (
    transactionId: string,
    updates: Partial<Transaction>,
    originalTransaction: Transaction
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const payload = { updates, originalTransaction };

      if (navigator.onLine) {
        // Online: update on server
        await apiClient.update("transactions", transactionId, payload);
        const updatedTransaction = { ...originalTransaction, ...updates };
        await offlineStorage.saveTransaction(updatedTransaction, true);
      } else {
        // Offline: update locally and mark for sync
        const updatedTransaction = { ...originalTransaction, ...updates };
        await offlineStorage.saveTransaction(updatedTransaction, false);
        await offlineStorage.addPendingAction({
          type: "update",
          collection: "transactions",
          data: payload,
        });

        toast({
          title: "💾 Transação atualizada offline",
          description: "Será sincronizada quando você estiver online",
        });
      }

      await refreshData();
      // Add a small delay to ensure balance update is processed on server
      setTimeout(() => {
        refreshWallets();
      }, 500);

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 1000);
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      toast({
        variant: "error",
        title: "Erro ao atualizar transação",
        description: "Tente novamente",
      });
    }
  };

  const deleteTransaction = async (transaction: Transaction) => {
    if (!user) throw new Error("User not authenticated");

    try {
      if (navigator.onLine) {
        // Online: delete on server
        await apiClient.delete("transactions", transaction.id, transaction);
        await offlineStorage.deleteItem(
          "transactions",
          transaction.id,
          user.uid
        );
      } else {
        // Offline: mark as deleted locally and queue for sync
        await offlineStorage.deleteItem(
          "transactions",
          transaction.id,
          user.uid
        );
        await offlineStorage.addPendingAction({
          type: "delete",
          collection: "transactions",
          data: transaction,
        });

        toast({
          title: "💾 Transação excluída offline",
          description: "Será sincronizada quando você estiver online",
        });
      }

      await refreshData();
      // Add a small delay to ensure balance update is processed on server
      setTimeout(() => {
        refreshWallets();
      }, 500);

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 1000);
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast({
        variant: "error",
        title: "Erro ao excluir transação",
        description: "Tente novamente",
      });
    }
  };

  const { categories, subcategories } = useMemo(() => {
    const categoryNames = Object.keys(categoryMap) as TransactionCategory[];
    return {
      categories: categoryNames.sort(),
      subcategories: categoryMap,
    };
  }, [categoryMap]);

  const saveCategories = async (newCategories: CategoryMap) => {
    if (!user) throw new Error("User not authenticated");

    try {
      if (navigator.onLine) {
        const currentSettings =
          (await apiClient.get("settings", user.uid)) || {};
        await apiClient.update("settings", user.uid, {
          ...currentSettings,
          categories: newCategories,
        });
        await offlineStorage.saveSetting("categories", newCategories);
      } else {
        await offlineStorage.saveSetting("categories", newCategories);
        toast({
          title: "💾 Categorias salvas offline",
          description: "Serão sincronizadas quando você estiver online",
        });
      }

      setCategoryMap(newCategories);
    } catch (error) {
      console.error("Erro ao salvar categorias:", error);
      toast({
        variant: "error",
        title: "Erro ao salvar categorias",
        description: "Tente novamente",
      });
    }
  };

  const addCategory = async (categoryName: TransactionCategory) => {
    if (categories.includes(categoryName)) {
      toast({ variant: "error", title: "Categoria já existe" });
      return;
    }
    const newCategoryMap = { ...categoryMap, [categoryName]: [] };
    await saveCategories(newCategoryMap);
  };

  const deleteCategory = async (categoryName: TransactionCategory) => {
    const newCategoryMap = { ...categoryMap };
    delete newCategoryMap[categoryName];
    await saveCategories(newCategoryMap);
    if (selectedCategory === categoryName) setSelectedCategory("all");
  };

  const addSubcategory = async (
    categoryName: TransactionCategory,
    subcategoryName: string
  ) => {
    const subs = categoryMap[categoryName] || [];
    if (subs.includes(subcategoryName)) {
      toast({ variant: "error", title: "Subcategoria já existe" });
      return;
    }
    const newCategoryMap = {
      ...categoryMap,
      [categoryName]: [...subs, subcategoryName].sort(),
    };
    await saveCategories(newCategoryMap);
  };

  const deleteSubcategory = async (
    categoryName: TransactionCategory,
    subcategoryName: string
  ) => {
    const subs = categoryMap[categoryName] || [];
    const newCategoryMap = {
      ...categoryMap,
      [categoryName]: subs.filter((s) => s !== subcategoryName),
    };
    await saveCategories(newCategoryMap);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory("all");
  };

  const filteredTransactions = useMemo(() => {
    return allTransactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        const toDate = dateRange?.to ? endOfDay(dateRange.to) : undefined;
        const dateCondition =
          dateRange?.from && toDate
            ? transactionDate >= dateRange.from && transactionDate <= toDate
            : true;
        const categoryCondition =
          selectedCategory === "all" || t.category === selectedCategory;
        const subcategoryCondition =
          selectedCategory === "all" ||
          selectedSubcategory === "all" ||
          t.subcategory === selectedSubcategory;
        return dateCondition && categoryCondition && subcategoryCondition;
      })
      .sort((a, b) => {
        // Ordenar por data decrescente (mais recente primeiro)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [allTransactions, dateRange, selectedCategory, selectedSubcategory]);

  const chartData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(
      (t) => t.type === "expense"
    );
    if (selectedCategory === "all") {
      const categoryTotals = expenseTransactions.reduce((acc, t) => {
        const key = t.category || "Outros";
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(categoryTotals).map(([name, total]) => ({
        name,
        total,
      }));
    } else {
      const subcategoryTotals = expenseTransactions
        .filter((t) => t.category === selectedCategory)
        .reduce((acc, t) => {
          const key = t.subcategory || "Sem Subcategoria";
          acc[key] = (acc[key] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);
      return Object.entries(subcategoryTotals).map(([name, total]) => ({
        name,
        total,
      }));
    }
  }, [filteredTransactions, selectedCategory]);

  const availableSubcategories =
    subcategories[selectedCategory as TransactionCategory] || [];

  const value: TransactionsContextType = {
    allTransactions,
    isLoading: isLoading || authLoading,
    filteredTransactions,
    chartData,
    dateRange,
    setDateRange,
    categories,
    subcategories,
    selectedCategory,
    handleCategoryChange,
    availableSubcategories,
    selectedSubcategory,
    setSelectedSubcategory,
    addTransaction,
    addGroupedTransaction,
    getChildTransactions,
    addChildTransaction,
    updateChildTransaction,
    deleteChildTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    isOnline,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error(
      "useTransactions must be used within a TransactionsProvider"
    );
  }
  return context;
}
