// src/hooks/use-wallets.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { collection, doc, setDoc, addDoc, Timestamp, onSnapshot, Unsubscribe, deleteDoc, writeBatch, query, where, getDocs, orderBy, updateDoc, increment } from "firebase/firestore";

interface WalletsContextType {
  wallets: Wallet[];
  isLoading: boolean;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt' | 'balance'>) => Promise<void>;
  updateWallet: (walletId: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
}

const WalletsContext = createContext<WalletsContextType | undefined>(undefined);

export function WalletsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listener for wallets
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setWallets([]);
      return;
    }

    setIsLoading(true);
    const { db } = getFirebase();
    const q = query(collection(db, "users", user.uid, "wallets"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedWallets: Wallet[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedWallets.push({ 
          id: doc.id, 
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        } as Wallet);
      });
      setWallets(fetchedWallets);
      setIsLoading(false);
    }, (error) => {
       console.error("Failed to fetch wallets:", error);
       toast({ variant: "destructive", title: "Erro ao Carregar Carteiras" });
       setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'createdAt' | 'balance'>) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    await addDoc(collection(db, "users", user.uid, "wallets"), {
        ...wallet,
        balance: 0,
        createdAt: new Date()
    });
    toast({ title: "Carteira criada com sucesso!" });
  }

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    const docRef = doc(db, "users", user.uid, "wallets", walletId);
    await setDoc(docRef, updates, { merge: true });
    toast({ title: "Carteira atualizada!" });
  }

  const deleteWallet = async (walletId: string) => {
    if (!user) throw new Error("User not authenticated");
    const { db } = getFirebase();
    
    // Check if there are transactions associated with this wallet
    const transactionsQuery = query(collection(db, "users", user.uid, "transactions"), where("walletId", "==", walletId));
    const transactionsSnapshot = await getDocs(transactionsQuery);

    if (!transactionsSnapshot.empty) {
        toast({
            variant: "destructive",
            title: "Não é possível excluir",
            description: "Existem transações associadas a esta carteira. Por favor, mova-as ou exclua-as primeiro.",
        });
        throw new Error("Cannot delete wallet with associated transactions.");
    }
    
    const docRef = doc(db, "users", user.uid, "wallets", walletId);
    await deleteDoc(docRef);
    toast({ title: "Carteira excluída." });
  }

  const value: WalletsContextType = {
    wallets,
    isLoading,
    addWallet,
    updateWallet,
    deleteWallet,
  };

  return (
    <WalletsContext.Provider value={value}>
        {children}
    </WalletsContext.Provider>
  )
}

export function useWallets() {
  const context = useContext(WalletsContext);
  if (context === undefined) {
    throw new Error("useWallets must be used within a WalletsProvider");
  }
  return context;
}
