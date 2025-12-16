// src/hooks/use-pluggy.tsx

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  PluggyItem,
  PluggyAccount,
  PluggyTransaction,
  PluggyTransactionListResponse,
} from "@/services/pluggy";

// ==================== TYPES ====================

export interface PluggyConnection {
  itemId: string;
  connectorName: string;
  connectorImageUrl: string;
  status: string;
  lastSyncedAt?: string;
  accounts?: PluggyAccount[];
}

export interface ImportTransactionsOptions {
  accountId: string;
  walletId: string;
  from?: string;
  to?: string;
  transactionIds?: string[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  message: string;
}

export interface InitiatePaymentOptions {
  amount: number;
  description?: string;
  recipientId?: string;
  // NEW: Just pass the PIX key - preferred method!
  pixKey?: string;
  receiverName?: string;
  // For saving the recipientId back to the contact
  contactId?: string;
  pixKeyId?: string;
  // Alternative: full recipient data
  recipientData?: {
    taxNumber: string;
    name: string;
    paymentInstitutionId: string;
    branch: string;
    accountNumber: string;
    accountType?: "CHECKING" | "SAVINGS";
    pixKey?: string;
  };
  installmentId?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  paymentRequestId?: string;
  error?: string;
}

// ==================== HOOK ====================

export function usePluggy() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ==================== FETCH CONNECTIONS ====================

  const fetchConnections = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/pluggy/items?userId=${user.uid}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch connections");
      }

      // Fetch accounts for each connection
      const connectionsWithAccounts = await Promise.all(
        (data.items || []).map(async (item: PluggyItem) => {
          try {
            const accountsRes = await fetch(
              `/api/pluggy/accounts?itemId=${item.id}`
            );
            const accountsData = await accountsRes.json();
            return {
              itemId: item.id,
              connectorName: item.connector.name,
              connectorImageUrl: item.connector.imageUrl,
              status: item.status,
              lastSyncedAt: item.lastUpdatedAt,
              accounts: accountsData.accounts || [],
            };
          } catch {
            return {
              itemId: item.id,
              connectorName: item.connector.name,
              connectorImageUrl: item.connector.imageUrl,
              status: item.status,
              lastSyncedAt: item.lastUpdatedAt,
              accounts: [],
            };
          }
        })
      );

      setConnections(connectionsWithAccounts);
    } catch (error: any) {
      console.error("Error fetching Pluggy connections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Initial fetch
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // ==================== OPEN CONNECT WIDGET ====================

  const openConnectWidget = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) {
      toast({
        variant: "error",
        title: "Erro",
        description: "Você precisa estar logado para conectar uma conta.",
      });
      return false;
    }

    setIsConnecting(true);
    try {
      // Get connect token
      const tokenRes = await fetch("/api/pluggy/connect-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error || "Failed to get connect token");
      }

      // Open Pluggy Connect widget
      // The widget is loaded from Pluggy's CDN
      return new Promise((resolve) => {
        // Timeout for script loading
        const loadTimeout = setTimeout(() => {
          console.error("Pluggy Connect script loading timeout");
          toast({
            variant: "error",
            title: "Erro ao carregar",
            description:
              "O widget de conexão demorou muito para carregar. Tente novamente.",
          });
          setIsConnecting(false);
          resolve(false);
        }, 15000); // 15 second timeout

        const script = document.createElement("script");
        script.src =
          "https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js";
        script.async = true;

        script.onerror = () => {
          clearTimeout(loadTimeout);
          console.error("Failed to load Pluggy Connect script");
          toast({
            variant: "error",
            title: "Erro ao carregar",
            description:
              "Não foi possível carregar o widget de conexão bancária.",
          });
          setIsConnecting(false);
          resolve(false);
        };

        script.onload = () => {
          clearTimeout(loadTimeout);

          // Check if PluggyConnect is available
          // @ts-ignore
          if (!window.PluggyConnect) {
            console.error("PluggyConnect not found in window");
            toast({
              variant: "error",
              title: "Erro",
              description: "Widget de conexão não disponível.",
            });
            setIsConnecting(false);
            resolve(false);
            return;
          }

          try {
            // @ts-ignore - Pluggy is loaded globally
            const pluggyConnect = new window.PluggyConnect({
              connectToken: tokenData.accessToken,
              onSuccess: async (data: { item: { id: string } }) => {
                // Store the connection
                await fetch("/api/pluggy/items", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    itemId: data.item.id,
                    userId: user.uid,
                  }),
                });

                toast({
                  title: "Conta conectada!",
                  description: "Sua conta bancária foi conectada com sucesso.",
                });

                // Refresh connections
                await fetchConnections();
                resolve(true);
              },
              onError: (error: { message: string }) => {
                console.error("Pluggy Connect error:", error);
                toast({
                  variant: "error",
                  title: "Erro na conexão",
                  description:
                    error.message || "Não foi possível conectar a conta.",
                });
                resolve(false);
              },
              onClose: () => {
                setIsConnecting(false);
              },
            });

            pluggyConnect.init();
          } catch (initError: any) {
            console.error("Error initializing Pluggy Connect:", initError);
            toast({
              variant: "error",
              title: "Erro",
              description: "Falha ao inicializar conexão bancária.",
            });
            setIsConnecting(false);
            resolve(false);
          }
        };

        document.body.appendChild(script);
      });
    } catch (error: any) {
      console.error("Error opening Pluggy Connect:", error);
      toast({
        variant: "error",
        title: "Erro",
        description:
          error.message || "Não foi possível abrir o widget de conexão.",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [user?.uid, toast, fetchConnections]);

  // ==================== DISCONNECT ====================

  const disconnectAccount = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!user?.uid) return false;

      try {
        const response = await fetch(
          `/api/pluggy/items?itemId=${itemId}&userId=${user.uid}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to disconnect");
        }

        toast({
          title: "Conta desconectada",
          description: "A conta bancária foi desconectada.",
        });

        await fetchConnections();
        return true;
      } catch (error: any) {
        console.error("Error disconnecting account:", error);
        toast({
          variant: "error",
          title: "Erro",
          description: error.message || "Não foi possível desconectar a conta.",
        });
        return false;
      }
    },
    [user?.uid, toast, fetchConnections]
  );

  // ==================== FETCH TRANSACTIONS ====================

  const fetchTransactions = useCallback(
    async (
      accountId: string,
      options?: { from?: string; to?: string }
    ): Promise<PluggyTransactionListResponse | null> => {
      try {
        const params = new URLSearchParams({ accountId });
        if (options?.from) params.append("from", options.from);
        if (options?.to) params.append("to", options.to);

        const response = await fetch(`/api/pluggy/transactions?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch transactions");
        }

        return data;
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        toast({
          variant: "error",
          title: "Erro",
          description:
            error.message || "Não foi possível buscar as transações.",
        });
        return null;
      }
    },
    [toast]
  );

  // ==================== IMPORT TRANSACTIONS ====================

  const importTransactions = useCallback(
    async (
      options: ImportTransactionsOptions
    ): Promise<ImportResult | null> => {
      if (!user?.uid) return null;

      try {
        const response = await fetch("/api/pluggy/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...options,
            userId: user.uid,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to import transactions");
        }

        toast({
          title: "Transações importadas!",
          description: data.message,
        });

        return data;
      } catch (error: any) {
        console.error("Error importing transactions:", error);
        toast({
          variant: "error",
          title: "Erro",
          description:
            error.message || "Não foi possível importar as transações.",
        });
        return null;
      }
    },
    [user?.uid, toast]
  );

  // ==================== INITIATE PAYMENT ====================

  const initiatePayment = useCallback(
    async (
      options: InitiatePaymentOptions
    ): Promise<PaymentInitiationResult> => {
      if (!user?.uid) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const response = await fetch("/api/pluggy/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...options,
            userId: user.uid,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to initiate payment");
        }

        return {
          success: true,
          paymentUrl: data.paymentRequest.paymentUrl,
          paymentRequestId: data.paymentRequest.id,
        };
      } catch (error: any) {
        console.error("Error initiating payment:", error);
        return {
          success: false,
          error: error.message || "Failed to initiate payment",
        };
      }
    },
    [user?.uid]
  );

  // ==================== GET PAYMENT STATUS ====================

  const getPaymentStatus = useCallback(async (paymentRequestId: string) => {
    try {
      const response = await fetch(
        `/api/pluggy/payments/initiate?paymentRequestId=${paymentRequestId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get payment status");
      }

      return data;
    } catch (error: any) {
      console.error("Error getting payment status:", error);
      return null;
    }
  }, []);

  // ==================== RETURN ====================

  return {
    // State
    connections,
    isLoading,
    isConnecting,
    hasConnections: connections.length > 0,

    // Actions
    openConnectWidget,
    disconnectAccount,
    fetchConnections,
    fetchTransactions,
    importTransactions,
    initiatePayment,
    getPaymentStatus,
  };
}
