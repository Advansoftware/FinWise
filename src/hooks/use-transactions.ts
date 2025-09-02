"use client";

import { useState, useMemo, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { getTransactions, addTransaction as addTransactionAction } from "@/app/actions";
import { useAuth } from "./use-auth";

interface TransactionsContextType {
  allTransactions: Transaction[];
  isLoading: boolean;
  filteredTransactions: Transaction[];
  chartData: { name: string; total: number }[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  categories: TransactionCategory[];
  subcategories: Partial<Record<TransactionCategory, string[]>>;
  selectedCategory: string;
  handleCategoryChange: (category: string) => void;
  availableSubcategories: string[];
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategory: string) => void;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const { user, loading: authLoading } = useAuth();

  const loadTransactions = useCallback(async () => {
    if (authLoading || !user) return;
    
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const transactions = await getTransactions(idToken);
      setAllTransactions(transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setAllTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user && !authLoading) {
      loadTransactions();
    } else if (!user && !authLoading) {
        setIsLoading(false);
        setAllTransactions([]);
    }
  }, [user, authLoading, loadTransactions]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if(!user) throw new Error("User not authenticated");
    const idToken = await user.getIdToken();
    await addTransactionAction(idToken, transaction);
    await loadTransactions();
  }

  const { categories, subcategories } = useMemo(() => {
    const categoriesSet = new Set<TransactionCategory>();
    const subcategoriesMap: Partial<Record<TransactionCategory, Set<string>>> = {};

    allTransactions.forEach(t => {
      categoriesSet.add(t.category);
      if (t.subcategory) {
        if (!subcategoriesMap[t.category]) {
          subcategoriesMap[t.category] = new Set();
        }
        subcategoriesMap[t.category]!.add(t.subcategory);
      }
    });

    const subcategoriesAsArray: Partial<Record<TransactionCategory, string[]>> = {};
    for (const cat in subcategoriesMap) {
      subcategoriesAsArray[cat as TransactionCategory] = Array.from(subcategoriesMap[cat as TransactionCategory]!);
    }

    return {
      categories: Array.from(categoriesSet).sort(),
      subcategories: subcategoriesAsArray
    };
  }, [allTransactions]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('all');
  };

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const dateCondition = dateRange?.from && dateRange?.to
        ? transactionDate >= dateRange.from && transactionDate <= dateRange.to
        : true;

      const categoryCondition = selectedCategory === 'all' || t.category === selectedCategory;

      const subcategoryCondition = selectedCategory === 'all'
        || selectedSubcategory === 'all'
        || t.subcategory === selectedSubcategory;

      return dateCondition && categoryCondition && subcategoryCondition;
    });
  }, [allTransactions, dateRange, selectedCategory, selectedSubcategory]);

  const chartData = useMemo(() => {
    if (selectedCategory === 'all') {
      const categoryTotals = filteredTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(categoryTotals).map(([name, total]) => ({ name, total }));
    } else {
      const subcategoryTotals = filteredTransactions
        .filter(t => t.category === selectedCategory)
        .reduce((acc, t) => {
          const key = t.subcategory || 'Outros';
          acc[key] = (acc[key] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);
      return Object.entries(subcategoryTotals).map(([name, total]) => ({ name, total }));
    }
  }, [filteredTransactions, selectedCategory]);

  const availableSubcategories = subcategories[selectedCategory as TransactionCategory] || [];

  const value = {
    allTransactions,
    isLoading,
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
    refreshTransactions: loadTransactions,
    addTransaction
  };

  return (
    <TransactionsContext.Provider value={value}>
        {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return context;
}
