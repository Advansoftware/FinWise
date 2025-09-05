// src/hooks/use-wallets.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";

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

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setWallets([]);
      return;
    }

    const loadWallets = async () => {
      setIsLoading(true);
      try {
        const fetchedWallets = await apiClient.get('wallets', user.uid);
        setWallets(fetchedWallets);
      } catch (error) {
        console.error('Erro ao carregar carteiras:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWallets();
  }, [user, authLoading]);

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'createdAt' | 'balance' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    
    const walletWithUser = {
      ...wallet,
      balance: 0, // Default balance
      userId: user.uid,
      createdAt: new Date().toISOString()
    };
    
    const newWallet = await apiClient.create('wallets', walletWithUser);
    setWallets(prev => [...prev, newWallet]);
    toast({ title: "Carteira adicionada com sucesso!" });
  };

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    if (!user) throw new Error("User not authenticated");
    
    await apiClient.update('wallets', walletId, updates);
    setWallets(prev => 
      prev.map(w => w.id === walletId ? { ...w, ...updates } : w)
    );
    toast({ title: "Carteira atualizada!" });
  };

  const deleteWallet = async (walletId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    await apiClient.delete('wallets', walletId);
    setWallets(prev => prev.filter(w => w.id !== walletId));
    toast({ title: "Carteira excluída." });
  };

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
  );
}

export function useWallets() {
  const context = useContext(WalletsContext);
  if (context === undefined) {
    throw new Error("useWallets must be used within a WalletsProvider");
  }
  return context;
}
