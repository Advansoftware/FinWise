// src/hooks/use-transactions.tsx
"use client";

import { useState, useMemo, useEffect, createContext, useContext, ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { offlineStorage } from "@/lib/offline-storage";

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
  updateTransaction: (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addCategory: (categoryName: TransactionCategory) => Promise<void>;
  deleteCategory: (categoryName: TransactionCategory) => Promise<void>;
  addSubcategory: (categoryName: TransactionCategory, subcategoryName: string) => Promise<void>;
  deleteSubcategory: (categoryName: TransactionCategory, subcategoryName: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshOnPageVisit: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setAllTransactions([]);
      setCategoryMap({});
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load transactions
        const fetchedTransactions = await apiClient.get('transactions', user.uid);
        setAllTransactions(fetchedTransactions);

        // Load categories from settings
        const settings = await apiClient.get('settings', user.uid);
        const categories = settings?.categories || {};
        
        // Se o usuário não tem categorias configuradas, configura as padrão
        if (Object.keys(categories).length === 0) {
          try {
            // Aplicar categorias padrão via API (cliente)
            const { DEFAULT_CATEGORIES } = await import('@/services/default-setup-service');
            await apiClient.update('settings', user.uid, { categories: DEFAULT_CATEGORIES });

            // Recarrega as configurações após a atualização
            const updatedSettings = await apiClient.get('settings', user.uid);
            setCategoryMap(updatedSettings?.categories || DEFAULT_CATEGORIES);
          } catch (migrationError) {
            console.error('Erro na aplicação das categorias padrão:', migrationError);
            // Se falhar, usar as categorias padrão localmente
            const { DEFAULT_CATEGORIES } = await import('@/services/default-setup-service');
            setCategoryMap(DEFAULT_CATEGORIES);
          }
        } else {
          setCategoryMap(categories);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Online event listener for auto-sync
    const handleOnline = async () => {
      console.log('Back online - syncing data...');
      await refreshOnPageVisit();
    };

    loadData();
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, authLoading]);
  
  const refreshTransactions = async () => {
    if (!user) return;
    
    try {
      if (navigator.onLine) {
        // Online: fetch from server
        const fetchedTransactions = await apiClient.get('transactions', user.uid);
        setAllTransactions(fetchedTransactions);
        
        // Update offline storage
        for (const transaction of fetchedTransactions) {
          await offlineStorage.saveTransaction(transaction, true);
        }
      } else {
        // Offline: load from local storage
        const offlineTransactions = await offlineStorage.getTransactions(user.uid);
        setAllTransactions(offlineTransactions);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      
      // Fallback to offline data if online request fails
      try {
        const offlineTransactions = await offlineStorage.getTransactions(user.uid);
        setAllTransactions(offlineTransactions);
      } catch (offlineError) {
        console.error('Error loading offline transactions:', offlineError);
      }
    }
  };
  
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");

    const transactionWithUser = { ...transaction, userId: user.uid };
    
    try {
      if (navigator.onLine) {
        // Online: save to server and update local state
        const newTransaction = await apiClient.create('transactions', transactionWithUser);
        setAllTransactions(prev => [newTransaction, ...prev]);
        
        // Also save to offline storage for caching
        await offlineStorage.saveTransaction(newTransaction, true);
      } else {
        // Offline: save locally with temporary ID
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const offlineTransaction = { ...transactionWithUser, id: tempId };
        
        // Add to local state immediately
        setAllTransactions(prev => [offlineTransaction, ...prev]);
        
        // Save to offline storage as unsynced
        await offlineStorage.saveTransaction(offlineTransaction, false);
        
        // Queue for sync when online
        await offlineStorage.addPendingAction({
          type: 'create',
          data: transactionWithUser
        });
        
        toast({
          title: "Salvo Offline",
          description: "Transação será sincronizada quando voltar online.",
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => {
    if (!user) throw new Error("User not authenticated");
    
    await apiClient.update('transactions', transactionId, updates);
    setAllTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, ...updates } : t)
    );
  };
  
  const deleteTransaction = async (transactionId: string) => {
    if (!user) throw new Error("User not authenticated");
    // Capture transaction data before removing from state so we can match pending actions
    const txToDelete = allTransactions.find(t => t.id === transactionId);

    try {
      await apiClient.delete('transactions', transactionId);
    } catch (err) {
      // Server delete may fail when offline or if id is temporary - continue local cleanup
      console.warn('Server delete failed or unavailable, proceeding to remove locally:', err);
    }

    // Remove from local state so UI updates immediately (charts, lists, etc.)
    setAllTransactions(prev => prev.filter(t => t.id !== transactionId));

    // Remove from offline DB
    try {
      await offlineStorage.deleteTransaction(transactionId);
    } catch (err) {
      console.warn('Failed to delete transaction from offline storage:', err);
    }

    // Also remove any pending offline actions that would recreate or modify this transaction
    try {
      const pending = await offlineStorage.getPendingActions();
      if (pending && pending.length > 0) {
        for (const action of pending) {
          // If the pending action references this exact id, remove it
          if (action.data && (action.data.id === transactionId || action.data._id === transactionId)) {
            await offlineStorage.removePendingAction(action.id);
            continue;
          }

          // Heuristic: if it's a create action and fields match the deleted transaction, remove it
          if (action.type === 'create' && txToDelete) {
            const d = action.data || {};
            const isMatch = (
              d.item === txToDelete.item &&
              Number(d.amount) === Number(txToDelete.amount) &&
              d.date === txToDelete.date &&
              (d.walletId === txToDelete.walletId || d.toWalletId === txToDelete.toWalletId)
            );
            if (isMatch) {
              await offlineStorage.removePendingAction(action.id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to cleanup pending offline actions:', err);
    }
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
    await apiClient.update('settings', user.uid, { 
      ...currentSettings, 
      categories: newCategories 
    });
    setCategoryMap(newCategories);
  };

  const addCategory = async (categoryName: TransactionCategory) => {
    if (!user) throw new Error("User not authenticated");
    if (categories.includes(categoryName)) {
      toast({ variant: "destructive", title: "Categoria já existe" });
      return;
    }
    const newCategoryMap = { ...categoryMap, [categoryName]: [] };
    await saveCategories(newCategoryMap);
  };

  const deleteCategory = async (categoryName: TransactionCategory) => {
    if (!user) throw new Error("User not authenticated");
    const newCategoryMap = { ...categoryMap };
    delete newCategoryMap[categoryName];
    await saveCategories(newCategoryMap);
    if (selectedCategory === categoryName) {
      setSelectedCategory('all');
    }
  };

  const addSubcategory = async (categoryName: TransactionCategory, subcategoryName: string) => {
    if (!user) throw new Error("User not authenticated");
    const subs = categoryMap[categoryName] || [];
    if (subs.includes(subcategoryName)) {
      toast({ variant: "destructive", title: "Subcategoria já existe" });
      return;
    }
    const newCategoryMap = { 
      ...categoryMap, 
      [categoryName]: [...subs, subcategoryName].sort() 
    };
    await saveCategories(newCategoryMap);
  };

  const deleteSubcategory = async (categoryName: TransactionCategory, subcategoryName: string) => {
    if (!user) throw new Error("User not authenticated");
    const subs = categoryMap[categoryName] || [];
    const newCategoryMap = {
      ...categoryMap,
      [categoryName]: subs.filter(s => s !== subcategoryName)
    };
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

      const dateCondition = dateRange?.from && toDate
        ? transactionDate >= dateRange.from && transactionDate <= toDate
        : true;

      const categoryCondition = selectedCategory === 'all' || (t.category && t.category === selectedCategory);

      const subcategoryCondition = selectedCategory === 'all'
        || selectedSubcategory === 'all'
        || (t.subcategory && t.subcategory === selectedSubcategory);

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
      const subcategoryTotals = expenseTransactions
        .filter(t => t.category === selectedCategory)
        .reduce((acc, t) => {
          const key = t.subcategory || 'Sem Subcategoria';
          acc[key] = (acc[key] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);
      return Object.entries(subcategoryTotals).map(([name, total]) => ({ name, total }));
    }
  }, [filteredTransactions, selectedCategory]);

  const refreshOnPageVisit = async () => {
    // Esta função é chamada quando o usuário navega para páginas específicas
    // para garantir que os dados estejam atualizados
    if (navigator.onLine) {
      await refreshTransactions();
      
      // Sync pending offline actions
      await offlineStorage.syncWhenOnline();
    } else {
      // Load offline data
      await refreshTransactions();
    }
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
    refreshTransactions,
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
