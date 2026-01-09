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
  useRef,
} from "react";
import { startOfMonth, endOfDay } from "date-fns";
import { Transaction, TransactionCategory, DateRange } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { useWallets } from "./use-wallets";
import { useDataRefresh } from "./use-data-refresh";

interface TransactionsProviderProps {
  children: ReactNode;
}

type CategoryMap = Partial<Record<TransactionCategory, string[]>>;

interface TransactionsContextType {
  allTransactions: Transaction[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadTransactions: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Force refresh (for internal use and refresh handler)
  const refreshDataInternal = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [fetchedTransactions, settings] = await Promise.all([
        apiClient.get("transactions", user.uid),
        apiClient.get("settings", user.uid),
      ]);

      setAllTransactions(fetchedTransactions);
      setCategoryMap(settings?.categories || {});
      setHasLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Use ref to track hasLoaded to avoid recreating loadTransactions
  const hasLoadedRef = useRef(hasLoaded);
  hasLoadedRef.current = hasLoaded;

  // Load transactions only when needed (lazy loading) - stable reference
  const loadTransactions = useCallback(async () => {
    if (!user || hasLoadedRef.current) return;
    await refreshDataInternal();
  }, [user?.uid, refreshDataInternal]);

  // Expose refreshData that forces reload
  const refreshData = useCallback(async () => {
    await refreshDataInternal();
  }, [refreshDataInternal]);

  // Store refreshData in a ref to avoid re-triggering useEffect
  const refreshDataRef = useCallback(
    () => refreshDataInternal(),
    [refreshDataInternal]
  );

  // Register refresh handler (but don't load immediately)
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setAllTransactions([]);
      setCategoryMap({});
      setHasLoaded(false);
      return;
    }

    // Register this hook's refresh function with the global system
    registerRefreshHandler("transactions", refreshDataRef);

    return () => {
      unregisterRefreshHandler("transactions");
    };
  }, [user?.uid, authLoading]);

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "userId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.create("transactions", {
        ...transaction,
        userId: user.uid,
      });

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar transação",
        description: "Tente novamente",
      });
    }
  };

  const addGroupedTransaction = async (
    parent: Omit<Transaction, "id" | "userId">,
    children: Omit<Transaction, "id" | "userId" | "parentId">[]
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.create("transactions/grouped", {
        parent: { ...parent, userId: user.uid },
        children: children.map((c) => ({ ...c, userId: user.uid })),
      });

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
    } catch (error) {
      console.error("Erro ao adicionar transação agrupada:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar transação",
        description: "Tente novamente",
      });
    }
  };

  const getChildTransactions = async (
    parentId: string
  ): Promise<Transaction[]> => {
    if (!user) throw new Error("User not authenticated");

    try {
      const children = await apiClient.get(
        `transactions/${parentId}/children`,
        user.uid
      );
      return children || [];
    } catch (error) {
      console.error("Erro ao buscar transações filhas:", error);
      return [];
    }
  };

  const addChildTransaction = async (
    parentId: string,
    child: Omit<Transaction, "id" | "userId" | "parentId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.create(`transactions/${parentId}/children`, {
        ...child,
        userId: user.uid,
        parentId,
      });

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      throw error;
    }
  };

  const updateChildTransaction = async (
    parentId: string,
    childId: string,
    updates: Partial<Transaction>
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.update(`transactions/${parentId}/children`, childId, {
        updates,
        userId: user.uid,
      });

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      throw error;
    }
  };

  const deleteChildTransaction = async (parentId: string, childId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.delete(`transactions/${parentId}/children`, childId, {
        userId: user.uid,
      });

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
      await apiClient.update("transactions", transactionId, {
        updates,
        originalTransaction,
      });

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
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
      await apiClient.delete("transactions", transaction.id, transaction);

      await refreshData();
      setTimeout(() => refreshWallets(), 500);
      setTimeout(() => triggerRefresh("all"), 1000);
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
      const currentSettings = (await apiClient.get("settings", user.uid)) || {};
      await apiClient.update("settings", user.uid, {
        ...currentSettings,
        categories: newCategories,
      });

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
    hasLoaded,
    loadTransactions,
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
