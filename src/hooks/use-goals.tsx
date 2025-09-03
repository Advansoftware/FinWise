
// src/hooks/use-goals.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { Goal, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { collection, doc, setDoc, addDoc, Timestamp, onSnapshot, Unsubscribe, deleteDoc, writeBatch, query, where, getDocs, orderBy, updateDoc, increment, runTransaction } from "firebase/firestore";

interface GoalsContextType {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addDeposit: (goalId: string, amount: number, walletId: string) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listener for goals
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setGoals([]);
      return;
    }

    setIsLoading(true);
    const { db } = getFirebase();
    const q = query(collection(db, "users", user.uid, "goals"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedGoals: Goal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedGoals.push({ 
          id: doc.id, 
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        } as Goal);
      });
      setGoals(fetchedGoals);
      setIsLoading(false);
    }, (error) => {
       console.error("Failed to fetch goals:", error);
       toast({ variant: "destructive", title: "Erro ao Carregar Metas" });
       setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    await addDoc(collection(db, "users", user.uid, "goals"), {
        ...goal,
        currentAmount: 0,
        createdAt: new Date()
    });
    toast({ title: "Meta criada com sucesso!" });
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    const docRef = doc(db, "users", user.uid, "goals", goalId);
    await setDoc(docRef, updates, { merge: true });
    toast({ title: "Meta atualizada!" });
  }

  const deleteGoal = async (goalId: string) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    // In a real app, you might want to handle what happens to deposited money.
    // For now, we'll just delete the goal.
    const docRef = doc(db, "users", user.uid, "goals", goalId);
    await deleteDoc(docRef);
    toast({ title: "Meta excluída." });
  }

  const addDeposit = async (goalId: string, amount: number, walletId: string) => {
     if (!user) throw new Error("User not authenticated");
     const { db } = getFirebase();
     const goalRef = doc(db, "users", user.uid, "goals", goalId);
     const walletRef = doc(db, "users", user.uid, "wallets", walletId);
     const transactionRef = doc(collection(db, "users", user.uid, "transactions"));

     await runTransaction(db, async (t) => {
        const goalDoc = await t.get(goalRef);
        if (!goalDoc.exists()) throw new Error("Meta não encontrada.");

        // Create the transaction record
        const newTransaction: Omit<Transaction, 'id'> = {
            item: `Depósito para Meta: ${goalDoc.data().name}`,
            amount: amount,
            date: new Date().toISOString(),
            category: "Transferência",
            type: 'transfer',
            walletId: walletId,
        };
        t.set(transactionRef, { ...newTransaction, date: new Date(newTransaction.date) });

        // Update wallet and goal balances
        t.update(walletRef, { balance: increment(-amount) });
        t.update(goalRef, { currentAmount: increment(amount) });
     });

     toast({ title: `Depósito de R$ ${amount.toFixed(2)} adicionado!`})
  }

  const value: GoalsContextType = {
    goals,
    isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    addDeposit,
  };

  return (
    <GoalsContext.Provider value={value}>
        {children}
    </GoalsContext.Provider>
  )
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalsProvider");
  }
  return context;
}
