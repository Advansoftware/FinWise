// src/hooks/use-wallets.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";
import { orderBy, where } from "firebase/firestore";

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
  const dbAdapter = getDatabaseAdapter();

  // Listener for wallets
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setWallets([]);
      return () => {};
    }

    setIsLoading(true);
    const unsubscribe = dbAdapter.listenToCollection<Wallet>(
      'users/USER_ID/wallets',
      (fetchedWallets) => {
        setWallets(fetchedWallets);
        setIsLoading(false);
      },
       (dbAdapter.constructor.name === 'FirebaseAdapter' ? [orderBy("createdAt", "desc")] : [])
    );
    
    return () => unsubscribe();
  }, [user, dbAdapter]);

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'createdAt' | 'balance'>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.addDoc('users/USER_ID/wallets',{
        ...wallet,
        balance: 0,
        createdAt: new Date()
    });
    toast({ title: "Carteira criada com sucesso!" });
  }

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.updateDoc(`users/USER_ID/wallets/${walletId}`, updates);
    toast({ title: "Carteira atualizada!" });
  }

  const deleteWallet = async (walletId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    // Check if there are transactions associated with this wallet
    // This is hard with the adapter pattern, as it would require a "getDocs" with a "where" clause.
    // For now, we assume the user knows what they're doing. A more robust solution
    // would add a `getDocs` method to the adapter interface.
    
    await dbAdapter.deleteDoc(`users/USER_ID/wallets/${walletId}`);
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
