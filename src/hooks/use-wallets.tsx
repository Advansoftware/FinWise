// src/hooks/use-wallets.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from "react";
import { Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getDatabaseAdapter } from "@/services/database/database-service";

interface WalletsContextType {
  wallets: Wallet[];
  isLoading: boolean;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt' | 'balance' | 'userId'>) => Promise<void>;
  updateWallet: (walletId: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
}

const WalletsContext = createContext<WalletsContextType | undefined>(undefined);

export function WalletsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dbAdapter = useMemo(() => getDatabaseAdapter(), []);

  // Listener for wallets
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setWallets([]);
      return;
    }

    setIsLoading(true);

    const unsubscribe = dbAdapter.listenToCollection<Wallet>(
      `wallets`,
      (fetchedWallets) => {
        setWallets(fetchedWallets);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user, authLoading, dbAdapter]);

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'createdAt' | 'balance' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.addDoc('wallets',{
        ...wallet,
        userId: user.uid,
        balance: 0,
        createdAt: new Date().toISOString()
    });
    toast({ title: "Carteira criada com sucesso!" });
  }

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    if (!user) throw new Error("User not authenticated");
    await dbAdapter.updateDoc(`wallets/${walletId}`, updates);
    toast({ title: "Carteira atualizada!" });
  }

  const deleteWallet = async (walletId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    await dbAdapter.deleteDoc(`wallets/${walletId}`);
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
