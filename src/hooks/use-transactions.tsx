
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
    await dbAdapter.runTransaction(async (t: any) => {
        const originalWallet = await t.get(`users/USER_ID/wallets/${originalTransaction.walletId}`);
        if (!originalWallet) throw new Error("Original wallet not found.");

        // Revert the original transaction amount from its wallet
        const revertAmount = originalTransaction.type === 'income' ? -originalTransaction.amount : originalTransaction.amount;
        t.update(`users/USER_ID/wallets/${originalTransaction.walletId}`, { balance: dbAdapter.increment(revertAmount) });

        // Apply the new transaction amount to its wallet
        const newAmount = updates.type === 'income' ? updates.amount : -(updates.amount ?? 0);
        t.update(`users/USER_ID/wallets/${updates.walletId}`, { balance: dbAdapter.increment(newAmount ?? 0) });

        // Finally, update the transaction document itself
        t.update(`users/USER_ID/transactions/${originalTransaction.id}`, updates);
    });
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
        t.update(`users/USER_ID/wallets/${transaction.walletId}`, { balance: dbAdapter.increment(amount) });
      }
      
      if (transaction.type === 'transfer') {
        if (!transaction.toWalletId) throw new Error("Destination wallet is required for transfers.");
        t.update(`users/USER_ID/wallets/${transaction.walletId}`, { balance: dbAdapter.increment(-transaction.amount) });
        t.update(`users/USER_ID/wallets/${transaction.toWalletId}`, { balance: dbAdapter.increment(transaction.amount) });
      }

      const newTransactionData = { ...transaction, amount: Math.abs(transaction.amount), date: new Date(transaction.date) };
      await t.set(`users/USER_ID/transactions/${Date.now()}`, newTransactionData);
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

     await dbAdapter.runTransaction(async (t: any) => {
        const transactionDoc = await t.get(`users/USER_ID/transactions/${transactionId}`);
        if (!transactionDoc || !transactionDoc.data()) {
            throw new Error("Transaction does not exist!");
        }

        const transactionData = transactionDoc.data() as Transaction;
        
        if (transactionData.type === 'income' || transactionData.type === 'expense') {
            const amount = transactionData.type === 'income' ? -transactionData.amount : transactionData.amount;
            await t.update(`users/USER_ID/wallets/${transactionData.walletId}`, { balance: dbAdapter.increment(amount) });
        }

        if (transactionData.type === 'transfer') {
           if (!transactionData.toWalletId) throw new Error("Cannot reverse transfer without destination wallet.");
           await t.update(`users/USER_ID/wallets/${transactionData.walletId}`, { balance: dbAdapter.increment(transactionData.amount) });
           await t.update(`users/USER_ID/wallets/${transactionData.toWalletId}`, { balance: dbAdapter.increment(-transactionData.amount) });
        }

        await t.delete(`users/USER_ID/transactions/${transactionId}`);
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
      await dbAdapter.setDoc(`users/USER_ID/settings/categories`, newCategories);
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
