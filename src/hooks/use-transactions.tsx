
// src/hooks/use-transactions.tsx
"use client";

import { useState, useMemo, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";
import { Transaction, TransactionCategory, Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { useWallets } from "./use-wallets";

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
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>, originalTransaction: Transaction) => Promise<void>;
  deleteTransaction: (transaction: Transaction) => Promise<void>;
  addCategory: (categoryName: TransactionCategory) => Promise<void>;
  deleteCategory: (categoryName: TransactionCategory) => Promise<void>;
  addSubcategory: (categoryName: TransactionCategory, subcategoryName: string) => Promise<void>;
  deleteSubcategory: (categoryName: TransactionCategory, subcategoryName: string) => Promise<void>;
  refreshOnPageVisit: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: TransactionsProviderProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { refreshWallets } = useWallets(); 
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  
  const refreshData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [fetchedTransactions, settings] = await Promise.all([
        apiClient.get('transactions', user.uid),
        apiClient.get('settings', user.uid)
      ]);
      setAllTransactions(fetchedTransactions);
      setCategoryMap(settings?.categories || {});
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
  }, [user?.uid, authLoading]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    const transactionWithUser = { ...transaction, userId: user.uid };
    await apiClient.create('transactions', transactionWithUser);
    await refreshData();
    // Refresh wallets after transaction changes
    refreshWallets();
  };

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>, originalTransaction: Transaction) => {
    if (!user) throw new Error("User not authenticated");
    
    // We send the original transaction along with the updates
    // so the backend can correctly revert the old balance and apply the new one.
    const payload = {
        updates,
        originalTransaction
    };
    await apiClient.update('transactions', transactionId, payload);
    await refreshData();
    // Refresh wallets after transaction changes
    refreshWallets();
  };
  
  const deleteTransaction = async (transaction: Transaction) => {
    if (!user) throw new Error("User not authenticated");
    // We send the entire transaction object on delete so the backend knows how to adjust wallet balance.
    await apiClient.delete('transactions', transaction.id, transaction);
    await refreshData();
    // Refresh wallets after transaction changes
    refreshWallets();
  };

  const { categories, subcategories } = useMemo(() => {
    const categoryNames = Object.keys(categoryMap) as TransactionCategory[];
    return {
      categories: categoryNames.sort(),
      subcategories: categoryMap
    };
  }, [categoryMap]);
  
  const saveCategories = async (newCategories: CategoryMap) => {
    if (!user) throw new Error("User not authenticated");
    const currentSettings = await apiClient.get('settings', user.uid) || {};
    await apiClient.update('settings', user.uid, { ...currentSettings, categories: newCategories });
    setCategoryMap(newCategories);
  };

  const addCategory = async (categoryName: TransactionCategory) => {
    if (categories.includes(categoryName)) {
      toast({ variant: "destructive", title: "Categoria já existe" });
      return;
    }
    const newCategoryMap = { ...categoryMap, [categoryName]: [] };
    await saveCategories(newCategoryMap);
  };

  const deleteCategory = async (categoryName: TransactionCategory) => {
    const newCategoryMap = { ...categoryMap };
    delete newCategoryMap[categoryName];
    await saveCategories(newCategoryMap);
    if (selectedCategory === categoryName) setSelectedCategory('all');
  };

  const addSubcategory = async (categoryName: TransactionCategory, subcategoryName: string) => {
    const subs = categoryMap[categoryName] || [];
    if (subs.includes(subcategoryName)) {
      toast({ variant: "destructive", title: "Subcategoria já existe" });
      return;
    }
    const newCategoryMap = { ...categoryMap, [categoryName]: [...subs, subcategoryName].sort() };
    await saveCategories(newCategoryMap);
  };

  const deleteSubcategory = async (categoryName: TransactionCategory, subcategoryName: string) => {
    const subs = categoryMap[categoryName] || [];
    const newCategoryMap = { ...categoryMap, [categoryName]: subs.filter(s => s !== subcategoryName) };
    await saveCategories(newCategoryMap);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('all');
  };

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const toDate = dateRange?.to ? endOfDay(dateRange.to) : undefined;
      const dateCondition = dateRange?.from && toDate ? transactionDate >= dateRange.from && transactionDate <= toDate : true;
      const categoryCondition = selectedCategory === 'all' || t.category === selectedCategory;
      const subcategoryCondition = selectedCategory === 'all' || selectedSubcategory === 'all' || t.subcategory === selectedSubcategory;
      return dateCondition && categoryCondition && subcategoryCondition;
    });
  }, [allTransactions, dateRange, selectedCategory, selectedSubcategory]);

  const chartData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    if (selectedCategory === 'all') {
      const categoryTotals = expenseTransactions.reduce((acc, t) => {
        const key = t.category || "Outros";
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(categoryTotals).map(([name, total]) => ({ name, total }));
    } else {
      const subcategoryTotals = expenseTransactions.filter(t => t.category === selectedCategory).reduce((acc, t) => {
        const key = t.subcategory || 'Sem Subcategoria';
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(subcategoryTotals).map(([name, total]) => ({ name, total }));
    }
  }, [filteredTransactions, selectedCategory]);

  const refreshOnPageVisit = async () => {
    await refreshData();
  };

  const availableSubcategories = subcategories[selectedCategory as TransactionCategory] || [];

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
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    refreshOnPageVisit,
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
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return context;
}
