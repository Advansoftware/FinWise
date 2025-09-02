
"use client";

import { useState, useMemo, useEffect, createContext, useContext, ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { collection, doc, setDoc, addDoc, Timestamp, onSnapshot, Unsubscribe, deleteDoc, writeBatch, query, where, getDocs, orderBy } from "firebase/firestore";
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
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setAllTransactions([]);
      setCategoryMap({});
      return;
    }

    setIsLoading(true);
    const { db } = getFirebase();
    
    // Real-time listener for transactions
    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"));
    const unsubscribeTransactions = onSnapshot(q, (querySnapshot) => {
      const transactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({ 
          id: doc.id, 
          ...data,
          date: (data.date as Timestamp).toDate().toISOString() 
        } as Transaction);
      });
      setAllTransactions(transactions);
      setIsLoading(false);
    }, (error) => {
       console.error("Failed to fetch transactions:", error);
       toast({ variant: "destructive", title: "Erro ao Carregar Transações" });
       setIsLoading(false);
    });

    // Real-time listener for categories
    const categoriesDocRef = doc(db, "users", user.uid, "settings", "categories");
    const unsubscribeCategories = onSnapshot(categoriesDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        setCategoryMap(docSnap.data() as CategoryMap);
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
            "Outros": ["Presentes", "Serviços", "Impostos"],
        };
        await setDoc(categoriesDocRef, defaultCategories);
        setCategoryMap(defaultCategories);
      }
    }, (error) => {
        let description = "Não foi possível buscar suas informações. Tente novamente mais tarde.";
        if (error instanceof FirebaseError && error.code === 'permission-denied') {
            description = "Acesso ao banco de dados negado. Verifique se o Cloud Firestore foi ativado em seu projeto Firebase e se as regras de segurança permitem leitura e escrita para usuários autenticados."
        }
        toast({ variant: "destructive", title: "Erro ao Carregar Categorias", description, duration: 10000 });
    });


    // Cleanup function to unsubscribe when component unmounts or user changes
    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
    };
  }, [user, toast]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    const transactionsCollection = collection(db, "users", user.uid, "transactions");
    await addDoc(transactionsCollection, {
        ...transaction,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date)
    });
  }

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    const batch = writeBatch(db);

    if (updateAllMatching) {
        // Query for all transactions with the same original item name
        const q = query(collection(db, "users", user.uid, "transactions"), where("item", "==", originalItemName));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            // Apply the same updates to all matching documents
            batch.update(doc.ref, { ...updates, date: new Date(updates.date!) });
        });
    } else {
        // Update only the single transaction
        const docRef = doc(db, "users", user.uid, "transactions", transactionId);
        batch.update(docRef, { ...updates, date: new Date(updates.date!) });
    }

    await batch.commit();
  };
  
  const deleteTransaction = async (transactionId: string) => {
     if (!user) throw new Error("User not authenticated");
     const { db } = getFirebase();
     const docRef = doc(db, "users", user.uid, "transactions", transactionId);
     await deleteDoc(docRef);
  }

  const { categories, subcategories } = useMemo(() => {
    const categoryNames = Object.keys(categoryMap) as TransactionCategory[];
    return {
      categories: categoryNames.sort(),
      subcategories: categoryMap
    };
  }, [categoryMap]);
  
  const saveCategories = async (userId: string, newCategories: CategoryMap) => {
      const { db } = getFirebase();
      const docRef = doc(db, "users", userId, "settings", "categories");
      await setDoc(docRef, newCategories);
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
