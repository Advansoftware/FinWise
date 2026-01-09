// src/hooks/use-installments.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Installment,
  InstallmentPayment,
  InstallmentSummary,
  CreateInstallmentInput,
} from "@/core/ports/installments.port";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useDataRefresh } from "./use-data-refresh";

interface InstallmentsContextType {
  // State
  installments: Installment[];
  summary: InstallmentSummary | null;
  isLoading: boolean;
  isOnline: boolean;
  hasLoaded: boolean;

  // Actions
  loadInstallments: () => Promise<void>;
  createInstallment: (
    data: CreateInstallmentInput
  ) => Promise<Installment | null>;
  updateInstallment: (
    id: string,
    data: Partial<Installment>
  ) => Promise<boolean>;
  deleteInstallment: (id: string) => Promise<boolean>;
  payInstallment: (
    installmentId: string,
    installmentNumber: number,
    paidAmount: number,
    transactionId?: string
  ) => Promise<boolean>;

  // Queries
  getUpcomingPayments: (days?: number) => Promise<InstallmentPayment[]>;
  getOverduePayments: () => Promise<InstallmentPayment[]>;
  getMonthlyProjections: (months?: number) => Promise<
    Array<{
      month: string;
      totalCommitment: number;
      installments: Array<{
        installmentId: string;
        name: string;
        amount: number;
      }>;
    }>
  >;

  // Utilities
  refreshData: () => Promise<void>;
}

const InstallmentsContext = createContext<InstallmentsContextType | null>(null);

export function InstallmentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Use ref to track hasLoaded to avoid recreating loadInstallments
  const hasLoadedRef = useRef(hasLoaded);
  hasLoadedRef.current = hasLoaded;

  const { user } = useAuth();
  const { toast } = useToast();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();

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

  const fetchInstallments = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/installments?userId=${user.uid}`);
      if (response.ok) {
        const data: Installment[] = await response.json();
        setInstallments(data);
      } else {
        throw new Error("Failed to fetch from server");
      }
    } catch (error) {
      console.error("Error fetching installments:", error);
      setInstallments([]);
    }
  }, [user?.uid]);

  const fetchSummary = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(
        `/api/installments?userId=${user.uid}&action=summary`
      );
      if (response.ok) {
        const data: InstallmentSummary = await response.json();
        setSummary(data);
      } else {
        throw new Error("Failed to fetch summary from server");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary(null);
    }
  }, [user?.uid]);

  // Force refresh (for internal use and refresh handler)
  const refreshDataInternal = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchInstallments(), fetchSummary()]);
    setHasLoaded(true);
    setIsLoading(false);
  }, [fetchInstallments, fetchSummary]);

  // Load installments only when needed (lazy loading)
  const loadInstallments = useCallback(async () => {
    if (!user?.uid || hasLoadedRef.current) return;
    await refreshDataInternal();
  }, [user?.uid, refreshDataInternal]);

  // Expose refreshData that forces reload
  const refreshData = useCallback(async () => {
    await refreshDataInternal();
  }, [refreshDataInternal]);

  // Register refresh handler (but don't load immediately)
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setInstallments([]);
      setSummary(null);
      setHasLoaded(false);
      return;
    }

    // Register this hook's refresh function with the global system
    registerRefreshHandler("installments", refreshDataInternal);

    return () => {
      unregisterRefreshHandler("installments");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const createInstallment = useCallback(
    async (data: CreateInstallmentInput): Promise<Installment | null> => {
      if (!user?.uid) return null;

      // Para parcelamentos recorrentes, o installmentAmount é o valor total (valor mensal/anual)
      // Para parcelamentos normais, é o valor total dividido pelo número de parcelas
      const installmentAmount = data.isRecurring
        ? data.totalAmount
        : data.totalAmount / data.totalInstallments;

      const installmentData: Omit<Installment, "id"> = {
        userId: user.uid,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installmentAmount,
        isActive: true,
        paidInstallments: 0,
        remainingInstallments: data.isRecurring
          ? 999999
          : data.totalInstallments, // Valor alto para recorrentes
        totalPaid: 0,
        remainingAmount: data.isRecurring ? data.totalAmount : data.totalAmount, // Para recorrentes, sempre renovável
        isCompleted: false,
        payments: [],
        // Campos específicos para recorrentes
        adjustmentHistory: data.isRecurring ? [] : undefined,
      };

      try {
        const response = await fetch("/api/installments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(installmentData),
        });

        if (response.ok) {
          const newInstallment = await response.json();
          setInstallments((prev) => [newInstallment, ...prev]);
          await fetchSummary();

          toast({
            title: "Parcelamento criado",
            description: `${data.name} foi adicionado com sucesso.`,
          });

          triggerRefresh();

          return newInstallment;
        } else {
          const error = await response.json();
          throw new Error(error.error || "Failed to create installment");
        }
      } catch (error: any) {
        console.error("Error creating installment:", error);
        toast({
          title: "Erro",
          description: error.message || "Falha ao criar parcelamento",
          variant: "error",
        });
        return null;
      }
    },
    [user?.uid, toast, fetchSummary, triggerRefresh]
  );

  const updateInstallment = useCallback(
    async (id: string, data: Partial<Installment>): Promise<boolean> => {
      if (!user?.uid) return false;

      try {
        const response = await fetch("/api/installments", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, userId: user.uid, ...data }),
        });

        if (response.ok) {
          const updatedInstallment = await response.json();
          setInstallments((prev) =>
            prev.map((installment) =>
              installment.id === id ? updatedInstallment : installment
            )
          );
          await fetchSummary();

          toast({
            title: "Parcelamento atualizado",
            description: "As informações foram atualizadas com sucesso.",
          });

          triggerRefresh();

          return true;
        } else {
          throw new Error("Failed to update installment");
        }
      } catch (error: any) {
        console.error("Error updating installment:", error);
        toast({
          title: "Erro",
          description: "Falha ao atualizar parcelamento",
          variant: "error",
        });
        return false;
      }
    },
    [user?.uid, toast, fetchSummary, triggerRefresh]
  );

  const deleteInstallment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/installments?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setInstallments((prev) =>
            prev.filter((installment) => installment.id !== id)
          );
          await fetchSummary();

          toast({
            title: "Parcelamento removido",
            description: "O parcelamento foi removido com sucesso.",
          });

          triggerRefresh();

          return true;
        } else {
          throw new Error("Failed to delete installment");
        }
      } catch (error: any) {
        console.error("Error deleting installment:", error);
        toast({
          title: "Erro",
          description: "Falha ao remover parcelamento",
          variant: "error",
        });
        return false;
      }
    },
    [toast, fetchSummary, triggerRefresh]
  );

  const payInstallment = useCallback(
    async (
      installmentId: string,
      installmentNumber: number,
      paidAmount: number,
      transactionId?: string
    ): Promise<boolean> => {
      const paymentData = {
        installmentId,
        installmentNumber,
        paidAmount,
        paidDate: new Date().toISOString(),
        transactionId,
      };

      try {
        const response = await fetch("/api/installments/pay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        });

        if (response.ok) {
          await refreshData();

          toast({
            title: "Pagamento registrado",
            description: `Parcela ${installmentNumber} foi marcada como paga.`,
          });

          return true;
        } else {
          throw new Error("Failed to record payment");
        }
      } catch (error: any) {
        console.error("Error paying installment:", error);
        toast({
          title: "Erro",
          description: "Falha ao registrar pagamento",
          variant: "error",
        });
        return false;
      }
    },
    [refreshData, toast]
  );

  const getUpcomingPayments = useCallback(
    async (days: number = 30): Promise<InstallmentPayment[]> => {
      if (!user?.uid) return [];

      try {
        const response = await fetch(
          `/api/installments?userId=${user.uid}&action=upcoming&days=${days}`
        );
        if (response.ok) {
          return await response.json();
        }
        return [];
      } catch (error) {
        console.error("Error fetching upcoming payments:", error);
        return [];
      }
    },
    [user?.uid]
  );

  const getOverduePayments = useCallback(async (): Promise<
    InstallmentPayment[]
  > => {
    if (!user?.uid) return [];

    try {
      const response = await fetch(
        `/api/installments?userId=${user.uid}&action=overdue`
      );
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Error fetching overdue payments:", error);
      return [];
    }
  }, [user?.uid]);

  const getMonthlyProjections = useCallback(
    async (months: number = 12) => {
      if (!user?.uid) return [];

      try {
        const response = await fetch(
          `/api/installments?userId=${user.uid}&action=projections&months=${months}`
        );
        if (response.ok) {
          return await response.json();
        }
        return [];
      } catch (error) {
        console.error("Error fetching projections:", error);
        return [];
      }
    },
    [user?.uid]
  );

  const value: InstallmentsContextType = {
    installments,
    summary,
    isLoading,
    isOnline,
    hasLoaded,
    loadInstallments,
    createInstallment,
    updateInstallment,
    deleteInstallment,
    payInstallment,
    getUpcomingPayments,
    getOverduePayments,
    getMonthlyProjections,
    refreshData,
  };

  return (
    <InstallmentsContext.Provider value={value}>
      {children}
    </InstallmentsContext.Provider>
  );
}

export function useInstallments() {
  const context = useContext(InstallmentsContext);
  if (!context) {
    throw new Error(
      "useInstallments must be used within an InstallmentsProvider"
    );
  }
  return context;
}
