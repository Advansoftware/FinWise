
"use client";

import { useState, useMemo, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, Timestamp, query, where, writeBatch, deleteDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

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
  refreshAllData: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
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
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  
  const refreshAllData = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    const { db } = getFirebase();
    const getTransactions = async (userId: string) => {
        const transactionsCollection = collection(db, "users", userId, "transactions");
        const querySnapshot = await getDocs(transactionsCollection);
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                date: (data.date as Timestamp).toDate().toISOString() 
            } as Transaction);
        });
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const getCategories = async (userId: string) => {
        const docRef = doc(db, "users", userId, "settings", "categories");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Partial<Record<TransactionCategory, string[]>>;
        } else {
            const defaultCategories = {
                "Supermercado": ["Mercearia", "Feira", "Açougue"],
                "Transporte": ["Combustível", "Uber/99", "Metrô/Ônibus"],
                "Restaurante": ["Almoço", "Jantar", "Café"],
                "Contas": ["Aluguel", "Luz", "Água", "Internet"],
                "Entretenimento": ["Cinema", "Show", "Streaming"],
                "Saúde": ["Farmácia", "Consulta"],
            };
            await setDoc(docRef, defaultCategories);
            return defaultCategories;
        }
    }


    try {
      const [transactions, categories] = await Promise.all([
        getTransactions(user.uid),
        getCategories(user.uid)
      ]);
      setAllTransactions(transactions);
      setCategoryMap(categories);
    } catch (error) {
        console.error("Failed to fetch data:", error);
        setAllTransactions([]);
        setCategoryMap({});

        let description = "Não foi possível buscar suas informações. Tente novamente mais tarde.";
        if (error instanceof FirebaseError && error.code === 'permission-denied') {
            description = "Acesso ao banco de dados negado. Verifique se o Cloud Firestore foi ativado em seu projeto Firebase e se as regras de segurança permitem leitura e escrita para usuários autenticados."
        }
        
        toast({
            variant: "destructive",
            title: "Erro ao Carregar Dados",
            description,
            duration: 10000,
        });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    const transactionsCollection = collection(db, "users", user.uid, "transactions");
    await addDoc(transactionsCollection, {
        ...transaction,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date)
    });
    await refreshAllData();
  }

  const { categories, subcategories } = useMemo(() => {
    const categoryNames = Object.keys(categoryMap) as TransactionCategory[];
    return {
      categories: categoryNames.sort(),
      subcategories: categoryMap
    };
  }, [categoryMap]);
  
  const saveCategories = async (userId: string, categories: CategoryMap) => {
      const { db } = getFirebase();
      const docRef = doc(db, "users", userId, "settings", "categories");
      await setDoc(docRef, categories);
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
    await refreshAllData();
  };

  const deleteCategory = async (categoryName: TransactionCategory) => {
    if (!user) throw new Error("User not authenticated");
     const newCategoryMap = { ...categoryMap };
     delete newCategoryMap[categoryName];
     await saveCategories(user.uid, newCategoryMap);
     await refreshAllData();
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
    await refreshAllData();
  }

  const deleteSubcategory = async (categoryName: TransactionCategory, subcategoryName: string) => {
    if (!user) throw new Error("User not authenticated");
    const subs = categoryMap[categoryName] || [];
    const newCategoryMap = {
      ...categoryMap,
      [categoryName]: subs.filter(s => s !== subcategoryName)
    };
    await saveCategories(user.uid, newCategoryMap);
    await refreshAllData();
  }


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
    refreshAllData: refreshAllData,
    addTransaction,
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
