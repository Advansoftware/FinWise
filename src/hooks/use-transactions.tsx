
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
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addCategory: (categoryName: TransactionCategory) => Promise<void>;
  deleteCategory: (categoryName: TransactionCategory) => Promise<void>;
  addSubcategory: (categoryName: TransactionCategory, subcategoryName: string) => Promise<void>;
  deleteSubcategory: (categoryName: TransactionCategory, subcategoryName: string) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

async function performAtomicUpdate(dbAdapter: IDatabaseAdapter, updates: Partial<Transaction>, originalTransaction: Transaction) {
    // This transaction logic is specific to adapters that support it, like Firebase.
    // For MongoDB, this would be a single API call to a dedicated endpoint.
    // Given the current structure, we'll implement the logic assuming client-side orchestration.
    
    // 1. Revert original transaction amount from its wallet(s)
    if (originalTransaction.type === 'transfer') {
        if(originalTransaction.toWalletId) {
             await dbAdapter.updateDoc(`users/USER_ID/wallets/${originalTransaction.walletId}`, { balance: dbAdapter.increment(originalTransaction.amount) });
             await dbAdapter.updateDoc(`users/USER_ID/wallets/${originalTransaction.toWalletId}`, { balance: dbAdapter.increment(-originalTransaction.amount) });
        }
    } else {
        const revertAmount = originalTransaction.type === 'income' ? -originalTransaction.amount : originalTransaction.amount;
        await dbAdapter.updateDoc(`users/USER_ID/wallets/${originalTransaction.walletId}`, { balance: dbAdapter.increment(revertAmount) });
    }

    // 2. Apply new transaction amount to its new wallet(s)
    const newType = updates.type || originalTransaction.type;
    const newAmount = updates.amount || originalTransaction.amount;
    const newWalletId = updates.walletId || originalTransaction.walletId;
    const newToWalletId = updates.toWalletId || originalTransaction.toWalletId;

    if (newType === 'transfer') {
        if (newToWalletId) {
            await dbAdapter.updateDoc(`users/USER_ID/wallets/${newWalletId}`, { balance: dbAdapter.increment(-newAmount) });
            await dbAdapter.updateDoc(`users/USER_ID/wallets/${newToWalletId}`, { balance: dbAdapter.increment(newAmount) });
        }
    } else {
        const applyAmount = newType === 'income' ? newAmount : -newAmount;
        await dbAdapter.updateDoc(`users/USER_ID/wallets/${newWalletId}`, { balance: dbAdapter.increment(applyAmount) });
    }

    // 3. Update the transaction document itself
    await dbAdapter.updateDoc(`users/USER_ID/transactions/${originalTransaction.id}`, updates);
}


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
    
    const transactionConstraints = [dbAdapter.queryConstraint('orderBy', 'date', 'desc')];

    const unsubscribeTransactions = dbAdapter.listenToCollection<Transaction>(
      'users/USER_ID/transactions',
      (transactions) => {
        setAllTransactions(transactions);
        setIsLoading(false);
      },
      transactionConstraints
    );

    const unsubscribeCategories = dbAdapter.listenToCollection<CategoryMap>(
      'users/USER_ID/settings',
      (settings) => {
         const catSettings = settings.find(s => (s as any).id === 'categories');
         if (catSettings) {
             setCategoryMap(catSettings as CategoryMap);
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
            dbAdapter.setDoc('users/USER_ID/settings/categories', defaultCategories);
         }
      }
    );


    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
    };
  }, [user, toast, dbAdapter]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error("User not authenticated");

    await dbAdapter.runTransaction(async (t: any) => {
      if (transaction.type === 'income' || transaction.type === 'expense') {
        const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        await dbAdapter.updateDoc(`users/USER_ID/wallets/${transaction.walletId}`, { balance: dbAdapter.increment(amount) });
      }
      
      if (transaction.type === 'transfer') {
        if (!transaction.toWalletId) throw new Error("Destination wallet is required for transfers.");
        await dbAdapter.updateDoc(`users/USER_ID/wallets/${transaction.walletId}`, { balance: dbAdapter.increment(-transaction.amount) });
        await dbAdapter.updateDoc(`users/USER_ID/wallets/${transaction.toWalletId}`, { balance: dbAdapter.increment(transaction.amount) });
      }

      const newTransactionData = { ...transaction, amount: Math.abs(transaction.amount), date: new Date(transaction.date) };
      await dbAdapter.addDoc('users/USER_ID/transactions', newTransactionData);
    });
  }

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => {
    if (!user) throw new Error("User not authenticated");
    
     if (updateAllMatching) {
        toast({ variant: "default", title: "Ação não suportada", description: "A atualização em lote não é suportada por este adaptador de banco de dados." });
    }
    
    const originalTransaction = allTransactions.find(t => t.id === transactionId);
    if (!originalTransaction) throw new Error("Transaction not found for update.");

    await performAtomicUpdate(dbAdapter, updates, originalTransaction);
  };
  
  const deleteTransaction = async (transactionId: string) => {
     if (!user) throw new Error("User not authenticated");

     const transactionToDelete = allTransactions.find(t => t.id === transactionId);
     if (!transactionToDelete) throw new Error("Transaction not found");

     await dbAdapter.runTransaction(async (t: any) => {
        if (transactionToDelete.type === 'income' || transactionToDelete.type === 'expense') {
            const amount = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
            await dbAdapter.updateDoc(`users/USER_ID/wallets/${transactionToDelete.walletId}`, { balance: dbAdapter.increment(amount) });
        }

        if (transactionToDelete.type === 'transfer') {
           if (!transactionToDelete.toWalletId) throw new Error("Cannot reverse transfer without destination wallet.");
           await dbAdapter.updateDoc(`users/USER_ID/wallets/${transactionToDelete.walletId}`, { balance: dbAdapter.increment(transactionToDelete.amount) });
           await dbAdapter.updateDoc(`users/USER_ID/wallets/${transactionToDelete.toWalletId}`, { balance: dbAdapter.increment(-transactionToDelete.amount) });
        }

        await dbAdapter.deleteDoc(`users/USER_ID/transactions/${transactionId}`);
     });
  }

  const { categories, subcategories } = useMemo(() => {
    const { id, ...cats } = categoryMap as any;
    const categoryNames = Object.keys(cats) as TransactionCategory[];
    return {
      categories: categoryNames.sort(),
      subcategories: cats
    };
  }, [categoryMap]);
  
  const saveCategories = async (userId: string, newCategories: CategoryMap) => {
      await dbAdapter.setDoc('users/USER_ID/settings/categories', newCategories);
  };

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
