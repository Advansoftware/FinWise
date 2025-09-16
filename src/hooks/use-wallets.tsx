// src/hooks/use-wallets.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction } from "react";
import { Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { offlineStorage } from "@/lib/offline-storage";

interface WalletsContextType {
  wallets: Wallet[];
  setWallets: Dispatch<SetStateAction<Wallet[]>>;
  isLoading: boolean;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt' | 'balance' | 'userId'>) => Promise<void>;
  updateWallet: (walletId: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
  refreshWallets: () => Promise<void>;
  isOnline: boolean;
}

const WalletsContext = createContext<WalletsContextType | undefined>(undefined);

export function WalletsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setWallets([]);
      return;
    }

    const loadWallets = async () => {
      setIsLoading(true);
      try {
        let fetchedWallets: Wallet[];

        if (navigator.onLine) {
          // Online: fetch from server and sync to offline storage
          fetchedWallets = await apiClient.get('wallets', user.uid);
          
          // Save to offline storage
          for (const wallet of fetchedWallets) {
            await offlineStorage.saveWallet(wallet, true);
          }
        } else {
          // Offline: load from offline storage
          fetchedWallets = await offlineStorage.getWallets(user.uid);
        }

        setWallets(fetchedWallets);
      } catch (error) {
        console.error('Erro ao carregar carteiras:', error);
        // Try to load from offline storage as fallback
        try {
          const offlineWallets = await offlineStorage.getWallets(user.uid);
          setWallets(offlineWallets);
        } catch (offlineError) {
          console.error('Erro ao carregar carteiras offline:', offlineError);
        }
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
      createdAt: new Date().toISOString(),
      id: `temp-${Date.now()}-${Math.random()}` // Temporary ID for offline
    };
    
    try {
      if (navigator.onLine) {
        // Online: create on server
        const newWallet = await apiClient.create('wallets', walletWithUser);
        await offlineStorage.saveWallet(newWallet, true);
        setWallets(prev => [...prev, newWallet]);
        toast({ title: "Carteira adicionada com sucesso!" });
      } else {
        // Offline: save locally and mark for sync
        await offlineStorage.saveWallet(walletWithUser, false);
        await offlineStorage.addPendingAction({
          type: 'create',
          collection: 'wallets',
          data: walletWithUser
        });
        
        setWallets(prev => [...prev, walletWithUser]);
        toast({
          title: "💾 Carteira salva offline",
          description: "Será sincronizada quando você estiver online"
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar carteira:', error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar carteira",
        description: "Tente novamente"
      });
    }
  };

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      if (navigator.onLine) {
        // Online: update on server
        await apiClient.update('wallets', walletId, updates);
        const updatedWallet = wallets.find(w => w.id === walletId);
        if (updatedWallet) {
          const finalWallet = { ...updatedWallet, ...updates };
          await offlineStorage.saveWallet(finalWallet, true);
        }
        toast({ title: "Carteira atualizada!" });
      } else {
        // Offline: update locally and mark for sync
        const updatedWallet = wallets.find(w => w.id === walletId);
        if (updatedWallet) {
          const finalWallet = { ...updatedWallet, ...updates };
          await offlineStorage.saveWallet(finalWallet, false);
          await offlineStorage.addPendingAction({
            type: 'update',
            collection: 'wallets',
            data: { id: walletId, ...updates }
          });
        }
        
        toast({
          title: "💾 Carteira atualizada offline",
          description: "Será sincronizada quando você estiver online"
        });
      }
      
      setWallets(prev => 
        prev.map(w => w.id === walletId ? { ...w, ...updates } : w)
      );
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar carteira",
        description: "Tente novamente"
      });
    }
  };

  const deleteWallet = async (walletId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      if (navigator.onLine) {
        // Online: delete on server
        await apiClient.delete('wallets', walletId);
        await offlineStorage.deleteItem('wallets', walletId);
        toast({ title: "Carteira excluída." });
      } else {
        // Offline: mark as deleted locally and queue for sync
        const walletToDelete = wallets.find(w => w.id === walletId);
        if (walletToDelete) {
          await offlineStorage.deleteItem('wallets', walletId);
          await offlineStorage.addPendingAction({
            type: 'delete',
            collection: 'wallets',
            data: walletToDelete
          });
        }
        
        toast({
          title: "💾 Carteira excluída offline",
          description: "Será sincronizada quando você estiver online"
        });
      }
      
      setWallets(prev => prev.filter(w => w.id !== walletId));
    } catch (error) {
      console.error('Erro ao excluir carteira:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir carteira",
        description: "Tente novamente"
      });
    }
  };

  const refreshWallets = async () => {
    if (!user) return;
    
    try {
      let fetchedWallets: Wallet[];

      if (navigator.onLine) {
        // Force fresh fetch from server, bypassing any caches
        fetchedWallets = await apiClient.get('wallets', user.uid);
        
        // Clear offline storage first to ensure fresh data
        await offlineStorage.clearCollection('wallets');
        
        // Save fresh data to offline storage
        for (const wallet of fetchedWallets) {
          await offlineStorage.saveWallet(wallet, true);
        }
      } else {
        fetchedWallets = await offlineStorage.getWallets(user.uid);
      }

      setWallets(fetchedWallets);
      console.log('🔄 Carteiras atualizadas:', fetchedWallets.map(w => `${w.name}: R$ ${w.balance.toFixed(2)}`));
    } catch (error) {
      console.error('Erro ao recarregar carteiras:', error);
      // Try offline fallback
      try {
        const offlineWallets = await offlineStorage.getWallets(user.uid);
        setWallets(offlineWallets);
      } catch (offlineError) {
        console.error('Erro ao recarregar carteiras offline:', offlineError);
      }
    }
  };

  const value: WalletsContextType = {
    wallets,
    setWallets,
    isLoading: isLoading || authLoading,
    addWallet,
    updateWallet,
    deleteWallet,
    refreshWallets,
    isOnline,
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
