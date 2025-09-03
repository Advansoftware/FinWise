// src/hooks/use-transactions.tsx
"use client";

import { useState, useMemo, useEffect, createContext, useContext, ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";
import { orderBy, where } from "firebase/firestore";

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
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
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
  const { user } = useAuth();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const dbAdapter = getDatabaseAdapter();
  
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setAllTransactions([]);
      setCategoryMap({});
      return () => {};
    }

    setIsLoading(true);
    
    // Real-time listener for transactions
    const unsubscribeTransactions = dbAdapter.listenToCollection<Transaction>(
      'users/USER_ID/transactions',
      (transactions) => {
        setAllTransactions(transactions);
        setIsLoading(false);
      },
      (dbAdapter.constructor.name === 'FirebaseAdapter' ? [orderBy("date", "desc")] : [])
    );

    // Listener for categories
    const unsubscribeCategories = dbAdapter.listenToCollection<CategoryMap>(
      'users/USER_ID/settings',
      (settings) => {
         const catSettings = settings.find(s => (s as any).id === 'categories');
         if (catSettings) {
             setCategoryMap(catSettings as CategoryMap);
         } else {
            // Initialize default categories if they don't exist
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
            dbAdapter.setDoc('users/USER_ID/settings/categories', defaultCategories);
         }
      }
    );


    // Cleanup function to unsubscribe when component unmounts or user changes
    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
    };
  }, [user, toast, dbAdapter]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error("User not authenticated");

    await dbAdapter.runTransaction(async (t) => {
      // Handle balance update for income/expense
      if (transaction.type === 'income' || transaction.type === 'expense') {
        const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        await t.update(`users/USER_ID/wallets/${transaction.walletId}`, { balance: dbAdapter.increment(amount) });
      }
      
      // Handle balance update for transfers
      if (transaction.type === 'transfer') {
        if (!transaction.toWalletId) throw new Error("Destination wallet is required for transfers.");
        await t.update(`users/USER_ID/wallets/${transaction.walletId}`, { balance: dbAdapter.increment(-transaction.amount) });
        await t.update(`users/USER_ID/wallets/${transaction.toWalletId}`, { balance: dbAdapter.increment(transaction.amount) });
      }

      // Create the transaction record itself
      const newTransactionData = { ...transaction, amount: Math.abs(transaction.amount), date: new Date(transaction.date) };
      await t.set(`users/USER_ID/transactions/${Date.now()}`, newTransactionData); // Using timestamp as ID for simplicity
    });
  }

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => {
    if (!user) throw new Error("User not authenticated");
    
    // The adapter pattern makes batch updates complex without a specific API for it.
    // For now, we'll simplify and only update the single transaction.
    // A full implementation would require a `batchUpdate` method in the IDatabaseAdapter.
     if (updateAllMatching) {
        toast({ variant: "default", title: "Ação não suportada", description: "A atualização em lote não é suportada por este adaptador de banco de dados." });
    }
    
    await dbAdapter.updateDoc(`users/USER_ID/transactions/${transactionId}`, { ...updates, date: new Date(updates.date!) });
  };
  
  const deleteTransaction = async (transactionId: string) => {
     if (!user) throw new Error("User not authenticated");

     await dbAdapter.runTransaction(async (t) => {
        const transactionDoc = await t.get(`users/USER_ID/transactions/${transactionId}`);
        if (!transactionDoc || !transactionDoc.data()) {
            throw new Error("Transaction does not exist!");
        }

        const transactionData = transactionDoc.data() as Transaction;
        
        // Handle balance update for income/expense
        if (transactionData.type === 'income' || transactionData.type === 'expense') {
            const amount = transactionData.type === 'income' ? -transactionData.amount : transactionData.amount;
            await t.update(`users/USER_ID/wallets/${transactionData.walletId}`, { balance: dbAdapter.increment(amount) });
        }

        // Handle balance update for transfers
        if (transactionData.type === 'transfer') {
           if (!transactionData.toWalletId) throw new Error("Cannot reverse transfer without destination wallet.");
           await t.update(`users/USER_ID/wallets/${transactionData.walletId}`, { balance: dbAdapter.increment(transactionData.amount) });
           await t.update(`users/USER_ID/wallets/${transactionData.toWalletId}`, { balance: dbAdapter.increment(-transactionData.amount) });
        }

        await t.delete(`users/USER_ID/transactions/${transactionId}`);
     });
  }

  const { categories, subcategories } = useMemo(() => {
    // Remove "id" from the map to get clean categories
    const { id, ...cats } = categoryMap as any;
    const categoryNames = Object.keys(cats) as TransactionCategory[];
    return {
      categories: categoryNames.sort(),
      subcategories: cats
    };
  }, [categoryMap]);
  
  const saveCategories = async (userId: string, newCategories: CategoryMap) => {
      await dbAdapter.setDoc(`users/USER_ID/settings/categories`, newCategories);
  };

  // --- Category Management ---
  const addCategory = async (categoryName: TransactionCategory) => {
    if (!user) throw new Error("User not authenticated");
    if (categories.includes(categoryName)) {
      toast({ variant: "destructive", title: "Categoria já existe" });
      return;
    }
    const newCategoryMap = { ...categoryMap, [categoryName]: [] };
    await saveCategories(user.uid, newCategoryMap);
  };

  const deleteCategory = async (categoryName: TransactionCategory) => {
    if (!user) throw new Error("User not authenticated");
     const newCategoryMap = { ...categoryMap };
     delete newCategoryMap[categoryName];
     await saveCategories(user.uid, newCategoryMap);
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
    await saveCategories(user.uid, newCategoryMap);
  }

  const deleteSubcategory = async (categoryName: TransactionCategory, subcategoryName: string) => {
    if (!user) throw new Error("User not authenticated");
    const subs = categoryMap[categoryName] || [];
    const newCategoryMap = {
      ...categoryMap,
      [categoryName]: subs.filter(s => s !== subcategoryName)
    };
    await saveCategories(user.uid, newCategoryMap);
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
    // We filter out transfers from chart data as they aren't expenses.
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
