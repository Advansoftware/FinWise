// src/hooks/use-transactions.tsx
"use client";

import { useState, useMemo, useEffect, createContext, useContext, ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";
import { IDatabaseAdapter } from "@/services/database/database-adapter";

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
  const dbAdapter = useMemo(() => getDatabaseAdapter(), []);
  
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setAllTransactions([]);
      setCategoryMap({});
      return;
    }

    setIsLoading(true);

    const unsubscribeTransactions = dbAdapter.listenToCollection<Transaction>(
      `transactions`,
      (transactions) => {
        setAllTransactions(transactions);
        setIsLoading(false);
      }
    );

    const unsubscribeCategories = dbAdapter.listenToCollection<{id: string, [key: string]: any}>(
      `settings`,
      (settings) => {
         const catSettings = settings.find(s => s.id === `categories_${user.uid}`);
         if (catSettings) {
             const { id, userId, ...cats} = catSettings;
             setCategoryMap(cats as CategoryMap);
         } else {
            const defaultCategories: CategoryMap = {
                "Supermercado": ["Mercearia", "Feira", "Açougue", "Bebidas"],
                "Transporte": ["Combustível", "Uber/99", "Metrô/Ônibus", "Estacionamento"],
                "Restaurante": ["Almoço", "Jantar", "Café", "Lanche"],
                "Contas": ["Aluguel", "Luz", "Água", "Internet", "Celular", "Condomínio"],
                "Entretenimento": ["Cinema", "Show", "Streaming", "Jogos"],
                "Saúde": ["Farmácia", "Consulta", "Plano de Saúde"],
                "Educação": ["Cursos", "Livros", "Mensalidade"],
                "Lazer": ["Viagem", "Passeios", "Hobbies"],
                "Vestuário": ["Roupas", "Calçados", "Acessórios"],
                "Salário": [],
                "Vendas": [],
                "Investimentos": [],
                "Transferência": [],
                "Outros": ["Presentes", "Serviços", "Impostos"],
            };
            dbAdapter.setDoc(`settings/categories_${user.uid}`, {...defaultCategories, userId: user.uid });
         }
      }
    );


    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
    };
  }, [user, authLoading, dbAdapter]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");

    const transactionWithUser = { ...transaction, userId: user.uid };
    
    // For MongoDB, we assume the backend API handles the balance update transactionally
    await dbAdapter.addDoc('transactions', transactionWithUser);
  }

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => {
    if (!user) throw new Error("User not authenticated");
    
    // For MongoDB, this complex logic should be a dedicated API endpoint if transactional integrity is needed.
    // Here, we just update the transaction document.
    await dbAdapter.updateDoc(`transactions/${transactionId}`, updates);
  };
  
  const deleteTransaction = async (transactionId: string) => {
     if (!user) throw new Error("User not authenticated");
     // For MongoDB, balance updates should be handled by a dedicated API endpoint
     await dbAdapter.deleteDoc(`transactions/${transactionId}`);
  }

  const { categories, subcategories } = useMemo(() => {
    const { id, userId, ...cats } = categoryMap as any;
    const categoryNames = Object.keys(cats) as TransactionCategory[];
    return {
      categories: categoryNames.sort(),
      subcategories: cats
    };
  }, [categoryMap]);
  
  const saveCategories = async (newCategories: CategoryMap) => {
      if (!user) throw new Error("User not authenticated");
      await dbAdapter.setDoc(`settings/categories_${user.uid}`, {...newCategories, userId: user.uid });
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
  }

  const deleteSubcategory = async (categoryName: TransactionCategory, subcategoryName: string) => {
    if (!user) throw new Error("User not authenticated");
    const subs = categoryMap[categoryName] || [];
    const newCategoryMap = {
      ...categoryMap,
      [categoryName]: subs.filter(s => s !== subcategoryName)
    };
    await saveCategories(newCategoryMap);
  }

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
