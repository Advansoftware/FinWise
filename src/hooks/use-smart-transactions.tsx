// src/hooks/use-smart-transactions.tsx
// Hook para gerenciar transações inteligentes

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { apiClient } from "@/lib/api-client";
import { Transaction, TransactionCategory } from "@/lib/types";
import {
  MerchantRule,
  TransactionSuggestions,
  DetectedRecurrence,
  TransactionAnomaly,
} from "@/lib/smart-transactions-types";

interface SmartTransactionsContextType {
  // Regras de estabelecimento
  merchantRules: MerchantRule[];
  isLoadingRules: boolean;
  loadMerchantRules: () => Promise<void>;
  createMerchantRule: (data: {
    merchantName: string;
    defaultCategory: TransactionCategory;
    defaultSubcategory?: string;
    defaultWalletId?: string;
    defaultType?: "income" | "expense";
  }) => Promise<MerchantRule | null>;
  updateMerchantRule: (
    ruleId: string,
    updates: Partial<MerchantRule>
  ) => Promise<boolean>;
  deleteMerchantRule: (ruleId: string) => Promise<boolean>;

  // Criar regra a partir de transação
  createRuleFromTransaction: (
    transaction: Transaction,
    applyToExisting?: boolean
  ) => Promise<{ rule: MerchantRule; appliedCount: number } | null>;

  // Sugestões inteligentes
  getSuggestions: (
    item: string,
    establishment?: string,
    amount?: number
  ) => Promise<TransactionSuggestions | null>;

  // Recorrências
  recurrences: DetectedRecurrence[];
  isLoadingRecurrences: boolean;
  loadRecurrences: () => Promise<void>;

  // Anomalias
  anomalies: TransactionAnomaly[];
  isLoadingAnomalies: boolean;
  loadAnomalies: () => Promise<void>;

  // Aplicar regra a transações
  applyRuleToTransactions: (
    ruleId: string,
    transactionIds: string[],
    updateCategory?: boolean,
    updateWallet?: boolean
  ) => Promise<{ success: boolean; updatedCount: number }>;
}

const SmartTransactionsContext = createContext<
  SmartTransactionsContextType | undefined
>(undefined);

export function useSmartTransactions() {
  const context = useContext(SmartTransactionsContext);
  if (!context) {
    throw new Error(
      "useSmartTransactions must be used within a SmartTransactionsProvider"
    );
  }
  return context;
}

interface SmartTransactionsProviderProps {
  children: ReactNode;
}

export function SmartTransactionsProvider({
  children,
}: SmartTransactionsProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [recurrences, setRecurrences] = useState<DetectedRecurrence[]>([]);
  const [isLoadingRecurrences, setIsLoadingRecurrences] = useState(false);
  const [anomalies, setAnomalies] = useState<TransactionAnomaly[]>([]);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(false);

  // Refs para evitar recargas desnecessárias
  const hasLoadedRules = useRef(false);
  const hasLoadedRecurrences = useRef(false);
  const hasLoadedAnomalies = useRef(false);

  // ==================== MERCHANT RULES ====================

  const loadMerchantRules = useCallback(async () => {
    if (!user || hasLoadedRules.current) return;

    setIsLoadingRules(true);
    try {
      const response = await fetch("/api/v1/merchant-rules", {
        headers: {
          "x-user-id": user.uid,
        },
      });

      if (response.ok) {
        const rules = await response.json();
        setMerchantRules(rules);
        hasLoadedRules.current = true;
      }
    } catch (error) {
      console.error("Erro ao carregar regras:", error);
    } finally {
      setIsLoadingRules(false);
    }
  }, [user]);

  const createMerchantRule = useCallback(
    async (data: {
      merchantName: string;
      defaultCategory: TransactionCategory;
      defaultSubcategory?: string;
      defaultWalletId?: string;
      defaultType?: "income" | "expense";
    }): Promise<MerchantRule | null> => {
      if (!user) return null;

      try {
        const response = await fetch("/api/v1/merchant-rules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const rule = await response.json();
          setMerchantRules((prev) => [rule, ...prev]);
          toast({
            title: "Regra criada!",
            description: `Transações de "${data.merchantName}" serão categorizadas automaticamente.`,
          });
          return rule;
        }
      } catch (error) {
        console.error("Erro ao criar regra:", error);
        toast({
          variant: "error",
          title: "Erro ao criar regra",
          description: "Tente novamente",
        });
      }
      return null;
    },
    [user, toast]
  );

  const updateMerchantRule = useCallback(
    async (
      ruleId: string,
      updates: Partial<MerchantRule>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`/api/v1/merchant-rules/${ruleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          setMerchantRules((prev) =>
            prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r))
          );
          return true;
        }
      } catch (error) {
        console.error("Erro ao atualizar regra:", error);
      }
      return false;
    },
    [user]
  );

  const deleteMerchantRule = useCallback(
    async (ruleId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`/api/v1/merchant-rules/${ruleId}`, {
          method: "DELETE",
          headers: {
            "x-user-id": user.uid,
          },
        });

        if (response.ok) {
          setMerchantRules((prev) => prev.filter((r) => r.id !== ruleId));
          toast({
            title: "Regra removida",
          });
          return true;
        }
      } catch (error) {
        console.error("Erro ao deletar regra:", error);
      }
      return false;
    },
    [user, toast]
  );

  const createRuleFromTransaction = useCallback(
    async (
      transaction: Transaction,
      applyToExisting: boolean = true
    ): Promise<{ rule: MerchantRule; appliedCount: number } | null> => {
      if (!user) return null;

      try {
        const response = await fetch("/api/v1/smart-transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
          body: JSON.stringify({
            action: "create-rule-from-transaction",
            transaction,
            applyToExisting,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setMerchantRules((prev) => [result.rule, ...prev]);

          const message =
            result.appliedCount > 0
              ? `Regra criada! ${result.appliedCount} transações atualizadas.`
              : "Regra criada para transações futuras.";

          toast({
            title: "Sucesso!",
            description: message,
          });

          return result;
        }
      } catch (error) {
        console.error("Erro ao criar regra da transação:", error);
        toast({
          variant: "error",
          title: "Erro",
          description: "Não foi possível criar a regra",
        });
      }
      return null;
    },
    [user, toast]
  );

  // ==================== SUGGESTIONS ====================

  const getSuggestions = useCallback(
    async (
      item: string,
      establishment?: string,
      amount?: number
    ): Promise<TransactionSuggestions | null> => {
      if (!user) return null;

      try {
        const params = new URLSearchParams({ item });
        if (establishment) params.append("establishment", establishment);
        if (amount) params.append("amount", String(amount));

        const response = await fetch(
          `/api/v1/smart-transactions?${params.toString()}`,
          {
            headers: {
              "x-user-id": user.uid,
            },
          }
        );

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
      }
      return null;
    },
    [user]
  );

  // ==================== RECURRENCES ====================

  const loadRecurrences = useCallback(async () => {
    if (!user || hasLoadedRecurrences.current) return;

    setIsLoadingRecurrences(true);
    try {
      const response = await fetch("/api/v1/recurrences", {
        headers: {
          "x-user-id": user.uid,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecurrences(data);
        hasLoadedRecurrences.current = true;
      }
    } catch (error) {
      console.error("Erro ao carregar recorrências:", error);
    } finally {
      setIsLoadingRecurrences(false);
    }
  }, [user]);

  // ==================== ANOMALIES ====================

  const loadAnomalies = useCallback(async () => {
    if (!user || hasLoadedAnomalies.current) return;

    setIsLoadingAnomalies(true);
    try {
      const response = await fetch("/api/v1/anomalies", {
        headers: {
          "x-user-id": user.uid,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnomalies(data);
        hasLoadedAnomalies.current = true;
      }
    } catch (error) {
      console.error("Erro ao carregar anomalias:", error);
    } finally {
      setIsLoadingAnomalies(false);
    }
  }, [user]);

  // ==================== APPLY RULE ====================

  const applyRuleToTransactions = useCallback(
    async (
      ruleId: string,
      transactionIds: string[],
      updateCategory: boolean = true,
      updateWallet: boolean = false
    ): Promise<{ success: boolean; updatedCount: number }> => {
      if (!user) return { success: false, updatedCount: 0 };

      try {
        const response = await fetch("/api/v1/smart-transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
          body: JSON.stringify({
            action: "apply-rule",
            ruleId,
            transactionIds,
            updateCategory,
            updateWallet,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.updatedCount > 0) {
            toast({
              title: "Regra aplicada!",
              description: `${result.updatedCount} transações atualizadas.`,
            });
          }
          return { success: true, updatedCount: result.updatedCount };
        }
      } catch (error) {
        console.error("Erro ao aplicar regra:", error);
        toast({
          variant: "error",
          title: "Erro",
          description: "Não foi possível aplicar a regra",
        });
      }
      return { success: false, updatedCount: 0 };
    },
    [user, toast]
  );

  const value: SmartTransactionsContextType = {
    merchantRules,
    isLoadingRules,
    loadMerchantRules,
    createMerchantRule,
    updateMerchantRule,
    deleteMerchantRule,
    createRuleFromTransaction,
    getSuggestions,
    recurrences,
    isLoadingRecurrences,
    loadRecurrences,
    anomalies,
    isLoadingAnomalies,
    loadAnomalies,
    applyRuleToTransactions,
  };

  return (
    <SmartTransactionsContext.Provider value={value}>
      {children}
    </SmartTransactionsContext.Provider>
  );
}
