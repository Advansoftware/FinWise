"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { getTransactions } from "@/app/actions";
import { useAuth } from "./use-auth";

export function useTransactions() {
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
    // Don't start loading if auth is still loading.
    if (authLoading) return;
    
    setIsLoading(true);
    try {
      // getTransactions will now throw an error if the user is not authenticated.
      // This is caught below.
      const transactions = await getTransactions();
      setAllTransactions(transactions);
    } catch (error) {
      // This will catch auth errors from getTransactions, so we don't need to show a toast.
      // The user will be redirected to the login page by the AppLayout.
      console.error("Failed to fetch transactions (likely due to auth):", error);
      setAllTransactions([]); // Clear transactions on error
    } finally {
      setIsLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    // Only attempt to load transactions if we have a user.
    // If there is no user, the AppLayout will redirect to /login.
    if (user && !authLoading) {
      loadTransactions();
    } else if (!user && !authLoading) {
        // If auth is done and there's no user, stop loading and clear transactions.
        setIsLoading(false);
        setAllTransactions([]);
    }
  }, [user, authLoading, loadTransactions]);

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
      categories: Array.from(categoriesSet),
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

  return {
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
  };
}
