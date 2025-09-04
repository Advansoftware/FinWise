// src/hooks/use-wallets.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";

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
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dbAdapter = getDatabaseAdapter();

  // Listener for wallets
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setIsLoading(false);
      setWallets([]);
      return;
    }

    setIsLoading(true);
    
    const constraints = (dbAdapter.constructor.name === 'FirebaseAdapter')
      ? [dbAdapter.queryConstraint('orderBy', 'createdAt', 'desc')]
      : [];

    const unsubscribe = dbAdapter.listenToCollection<Wallet>(
      'users/USER_ID/wallets',
      (fetchedWallets) => {
        setWallets(fetchedWallets);
        setIsLoading(false);
      },
      constraints
    );
    
    return () => unsubscribe();
  }, [user, authLoading, dbAdapter]);

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
    
    await dbAdapter.deleteDoc(`users/USER_ID/wallets/${walletId}`);
    toast({ title: "Carteira excluída." });
  }

  const value: WalletsContextType = {
    wallets,
    isLoading: isLoading || authLoading,
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
