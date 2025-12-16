// src/hooks/use-smart-transfers.tsx

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// ==================== TYPES ====================

export interface SmartTransferPreauthorization {
  id: string;
  pluggyPreauthorizationId: string;
  userId: string;
  connectorId: number;
  connectorName: string;
  recipientIds: string[];
  status: "CREATED" | "COMPLETED" | "REJECTED" | "ERROR" | "EXPIRED";
  consentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartTransferPayment {
  id: string;
  pluggyPaymentId: string;
  userId: string;
  preauthorizationId: string;
  recipientId: string;
  amount: number;
  description?: string;
  status:
    | "CONSENT_AUTHORIZED"
    | "PAYMENT_PENDING"
    | "PAYMENT_COMPLETED"
    | "PAYMENT_REJECTED"
    | "ERROR";
  installmentId?: string;
  installmentNumber?: number;
  createdAt: string;
  updatedAt: string;
  paymentReceipt?: {
    endToEndId: string;
    completedAt: string;
  };
}

export interface CreatePreauthorizationOptions {
  connectorId: number;
  cpf: string;
  cnpj?: string;
  recipientIds: string[];
}

export interface CreatePaymentOptions {
  recipientId: string;
  amount: number;
  description?: string;
  installmentId?: string;
  installmentNumber?: number;
  walletId?: string;
}

// ==================== HOOK ====================

export function useSmartTransfers() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [preauthorizations, setPreauthorizations] = useState<
    SmartTransferPreauthorization[]
  >([]);
  const [activePreauthorization, setActivePreauthorization] =
    useState<SmartTransferPreauthorization | null>(null);
  const [payments, setPayments] = useState<SmartTransferPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // ==================== FETCH PREAUTHORIZATIONS ====================

  const fetchPreauthorizations = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/pluggy/smart-transfers/preauthorizations?userId=${user.uid}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch preauthorizations");
      }

      setPreauthorizations(data.preauthorizations || []);
      setActivePreauthorization(data.activePreauthorization || null);
    } catch (error: any) {
      console.error("Error fetching preauthorizations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // ==================== CREATE PREAUTHORIZATION ====================

  const createPreauthorization = useCallback(
    async (options: CreatePreauthorizationOptions) => {
      if (!user?.uid) {
        return { success: false, error: "User not authenticated" };
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          "/api/pluggy/smart-transfers/preauthorizations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...options,
              userId: user.uid,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create preauthorization");
        }

        // Refresh preauthorizations list
        await fetchPreauthorizations();

        return {
          success: true,
          preauthorization: data.preauthorization,
          consentUrl: data.preauthorization.consentUrl,
        };
      } catch (error: any) {
        console.error("Error creating preauthorization:", error);
        toast({
          title: "Erro ao criar autorização",
          description: error.message,
          variant: "error",
        });
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, fetchPreauthorizations, toast]
  );

  // ==================== CHECK PREAUTHORIZATION STATUS ====================

  const checkPreauthorizationStatus = useCallback(
    async (preauthorizationId: string) => {
      if (!user?.uid) return null;

      try {
        const response = await fetch(
          `/api/pluggy/smart-transfers/preauthorizations?userId=${user.uid}&preauthorizationId=${preauthorizationId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to check status");
        }

        // Refresh if status changed
        if (data.preauthorization?.status !== activePreauthorization?.status) {
          await fetchPreauthorizations();
        }

        return data.preauthorization;
      } catch (error: any) {
        console.error("Error checking preauthorization status:", error);
        return null;
      }
    },
    [user?.uid, activePreauthorization?.status, fetchPreauthorizations]
  );

  // ==================== CREATE PAYMENT ====================

  const createPayment = useCallback(
    async (options: CreatePaymentOptions) => {
      if (!user?.uid) {
        return { success: false, error: "User not authenticated" };
      }

      if (!activePreauthorization) {
        return {
          success: false,
          error: "Nenhuma autorização ativa encontrada",
          code: "NO_ACTIVE_PREAUTHORIZATION",
        };
      }

      setIsCreatingPayment(true);
      try {
        const response = await fetch("/api/pluggy/smart-transfers/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...options,
            userId: user.uid,
            preauthorizationId: activePreauthorization.pluggyPreauthorizationId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create payment");
        }

        toast({
          title:
            data.payment.status === "PAYMENT_COMPLETED"
              ? "✅ Pagamento realizado!"
              : "⏳ Processando pagamento...",
          description: data.message,
        });

        return {
          success: true,
          payment: data.payment,
        };
      } catch (error: any) {
        console.error("Error creating payment:", error);
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "error",
        });
        return { success: false, error: error.message };
      } finally {
        setIsCreatingPayment(false);
      }
    },
    [user?.uid, activePreauthorization, toast]
  );

  // ==================== FETCH PAYMENTS ====================

  const fetchPayments = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(
        `/api/pluggy/smart-transfers/payments?userId=${user.uid}`
      );
      const data = await response.json();

      if (response.ok) {
        setPayments(data.payments || []);
      }
    } catch (error: any) {
      console.error("Error fetching payments:", error);
    }
  }, [user?.uid]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (user?.uid) {
      fetchPreauthorizations();
    }
  }, [user?.uid, fetchPreauthorizations]);

  // ==================== RETURN ====================

  return {
    // State
    preauthorizations,
    activePreauthorization,
    payments,
    isLoading,
    isCreatingPayment,
    hasActivePreauthorization: !!activePreauthorization,

    // Actions
    fetchPreauthorizations,
    createPreauthorization,
    checkPreauthorizationStatus,
    createPayment,
    fetchPayments,
  };
}
