// src/hooks/use-wallets.tsx
"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Wallet } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { apiClient } from "@/lib/api-client";
import { useDataRefresh } from "./use-data-refresh";

interface WalletsContextType {
  wallets: Wallet[];
  setWallets: Dispatch<SetStateAction<Wallet[]>>;
  isLoading: boolean;
  addWallet: (
    wallet: Omit<Wallet, "id" | "createdAt" | "balance" | "userId">
  ) => Promise<void>;
  updateWallet: (walletId: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
  refreshWallets: () => Promise<void>;
  isOnline: boolean;
}

const WalletsContext = createContext<WalletsContextType | undefined>(undefined);

export function WalletsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
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
        const fetchedWallets: Wallet[] = await apiClient.get(
          "wallets",
          user.uid
        );
        setWallets(fetchedWallets);
      } catch (error) {
        console.error("Erro ao carregar carteiras:", error);
        setWallets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWallets();

    // Register this hook's refresh function with the global system
    registerRefreshHandler("wallets", loadWallets);

    return () => {
      unregisterRefreshHandler("wallets");
    };
  }, [user, authLoading]);

  const addWallet = async (
    wallet: Omit<Wallet, "id" | "createdAt" | "balance" | "userId">
  ) => {
    if (!user) throw new Error("User not authenticated");

    const walletWithUser = {
      ...wallet,
      balance: 0, // Default balance
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      const newWallet = await apiClient.create("wallets", walletWithUser);
      setWallets((prev) => [...prev, newWallet]);
      toast({ title: "Carteira adicionada com sucesso!" });

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 500);
    } catch (error) {
      console.error("Erro ao adicionar carteira:", error);
      toast({
        variant: "error",
        title: "Erro ao adicionar carteira",
        description: "Tente novamente",
      });
    }
  };

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.update("wallets", walletId, updates);
      setWallets((prev) =>
        prev.map((w) => (w.id === walletId ? { ...w, ...updates } : w))
      );
      toast({ title: "Carteira atualizada!" });

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 500);
    } catch (error) {
      console.error("Erro ao atualizar carteira:", error);
      toast({
        variant: "error",
        title: "Erro ao atualizar carteira",
        description: "Tente novamente",
      });
    }
  };

  const deleteWallet = async (walletId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await apiClient.delete("wallets", walletId);
      setWallets((prev) => prev.filter((w) => w.id !== walletId));
      toast({ title: "Carteira excluída." });

      // Trigger global refresh to update other pages/components
      setTimeout(() => {
        triggerRefresh("all");
      }, 500);
    } catch (error) {
      console.error("Erro ao excluir carteira:", error);
      toast({
        variant: "error",
        title: "Erro ao excluir carteira",
        description: "Tente novamente",
      });
    }
  };

  const refreshWallets = async () => {
    if (!user) return;

    try {
      const fetchedWallets: Wallet[] = await apiClient.get("wallets", user.uid);
      setWallets(fetchedWallets);
      console.log(
        "🔄 Carteiras atualizadas:",
        fetchedWallets.map((w) => `${w.name}: R$ ${w.balance.toFixed(2)}`)
      );
    } catch (error) {
      console.error("Erro ao recarregar carteiras:", error);
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
    <WalletsContext.Provider value={value}>{children}</WalletsContext.Provider>
  );
}

export function useWallets() {
  const context = useContext(WalletsContext);
  if (context === undefined) {
    throw new Error("useWallets must be used within a WalletsProvider");
  }
  return context;
}
