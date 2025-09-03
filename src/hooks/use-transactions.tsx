
"use client";

import { useState, useMemo, useEffect, createContext, useContext, ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { collection, doc, setDoc, addDoc, Timestamp, onSnapshot, Unsubscribe, deleteDoc, writeBatch, query, where, getDocs, orderBy, runTransaction, increment } from "firebase/firestore";
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
    from: startOfMonth(new Date()),
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
        
        let dateValue: string;
        // Robust date handling
        if (data.date instanceof Timestamp) {
            dateValue = data.date.toDate().toISOString();
        } else if (typeof data.date === 'string') {
            dateValue = new Date(data.date).toISOString();
        } else {
            // Fallback for unexpected formats
            dateValue = new Date().toISOString();
        }

        transactions.push({ 
          id: doc.id, 
          ...data,
          date: dateValue,
          type: data.type || 'expense', // Default to expense if type is missing
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
      if (docSnap.exists() && Object.keys(docSnap.data()).length > 0) {
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
            "Salário": [],
            "Vendas": [],
            "Investimentos": [],
            "Transferência": [],
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
    const walletRef = doc(db, "users", user.uid, "wallets", transaction.walletId);
    const transactionRef = doc(collection(db, "users", user.uid, "transactions"));

    // For transfers, we need a second wallet
    if (transaction.type === 'transfer') {
        // Here you would typically have a "toWalletId" field in your form.
        // For simplicity in this example, we'll assume a real implementation
        // would get the destination wallet ID from the user.
        // Since we don't have that, we'll just debit the source wallet.
        // A full implementation would credit the destination wallet.
        toast({ title: "Transferência registrada.", description: "Apenas o débito na carteira de origem foi registrado."})
    }

    await runTransaction(db, async (t) => {
        const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        // Transfers are always a debit from the perspective of the source wallet
        t.update(walletRef, { balance: increment(amount) });
        t.set(transactionRef, { ...transaction, amount: Math.abs(transaction.amount), date: new Date(transaction.date) });
    });
  }

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>, updateAllMatching: boolean, originalItemName: string) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    const batch = writeBatch(db);

    // Note: Updating balances for past transactions can be complex.
    // A full implementation would require calculating the balance delta and applying it.
    // For this implementation, we assume balance is managed but not retroactively corrected on edit.
    // This is a simplification.

    if (updateAllMatching) {
        const q = query(collection(db, "users", user.uid, "transactions"), where("item", "==", originalItemName));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            batch.update(doc.ref, { ...updates, date: new Date(updates.date!) });
        });
    } else {
        const docRef = doc(db, "users", user.uid, "transactions", transactionId);
        batch.update(docRef, { ...updates, date: new Date(updates.date!) });
    }

    await batch.commit();
  };
  
  const deleteTransaction = async (transactionId: string) => {
     if (!user) throw new Error("User not authenticated");
     const { db } = getFirebase();
     const transactionRef = doc(db, "users", user.uid, "transactions", transactionId);
     
     await runTransaction(db, async (t) => {
        const transactionDoc = await t.get(transactionRef);
        if (!transactionDoc.exists()) {
            throw "Transaction does not exist!";
        }

        const transactionData = transactionDoc.data() as Transaction;
        const walletRef = doc(db, "users", user.uid, "wallets", transactionData.walletId);
        // Reverse the amount for balance correction
        const amount = transactionData.type === 'income' ? -transactionData.amount : transactionData.amount;
        
        // Transfers are also reversed: money comes back to the source wallet.
        t.update(walletRef, { balance: increment(amount) });
        t.delete(transactionRef);
     });
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
