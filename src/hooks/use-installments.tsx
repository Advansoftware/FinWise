// src/hooks/use-installments.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Installment, InstallmentPayment, InstallmentSummary, CreateInstallmentInput } from '@/core/ports/installments.port';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface InstallmentsContextType {
  // State
  installments: Installment[];
  summary: InstallmentSummary | null;
  isLoading: boolean;
  
  // Actions
  createInstallment: (data: CreateInstallmentInput) => Promise<Installment | null>;
  updateInstallment: (id: string, data: Partial<Installment>) => Promise<boolean>;
  deleteInstallment: (id: string) => Promise<boolean>;
  payInstallment: (installmentId: string, installmentNumber: number, paidAmount: number, transactionId?: string) => Promise<boolean>;
  
  // Queries
  getUpcomingPayments: (days?: number) => Promise<InstallmentPayment[]>;
  getOverduePayments: () => Promise<InstallmentPayment[]>;
  getMonthlyProjections: (months?: number) => Promise<Array<{
    month: string;
    totalCommitment: number;
    installments: Array<{
      installmentId: string;
      name: string;
      amount: number;
    }>;
  }>>;
  
  // Utilities
  refreshData: () => Promise<void>;
}

const InstallmentsContext = createContext<InstallmentsContextType | null>(null);

export function InstallmentsProvider({ children }: { children: React.ReactNode }) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInstallments = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/installments?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setInstallments(data);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
    }
  }, [user?.uid]);

  const fetchSummary = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/installments?userId=${user.uid}&action=summary`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, [user?.uid]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchInstallments(), fetchSummary()]);
    setIsLoading(false);
  }, [fetchInstallments, fetchSummary]);

  useEffect(() => {
    if (user?.uid) {
      refreshData();
    }
  }, [user?.uid, refreshData]);

  const createInstallment = useCallback(async (data: CreateInstallmentInput): Promise<Installment | null> => {
    if (!user?.uid) return null;

    try {
      const response = await fetch('/api/installments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          ...data,
        }),
      });

      if (response.ok) {
        const newInstallment = await response.json();
        setInstallments(prev => [newInstallment, ...prev]);
        await fetchSummary(); // Atualizar resumo
        
        toast({
          title: "Parcelamento criado",
          description: `${data.name} foi adicionado com sucesso.`,
        });
        
        return newInstallment;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create installment');
      }
    } catch (error: any) {
      console.error('Error creating installment:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar parcelamento",
        variant: "destructive",
      });
      return null;
    }
  }, [user?.uid, toast, fetchSummary]);

  const updateInstallment = useCallback(async (id: string, data: Partial<Installment>): Promise<boolean> => {
    try {
      const response = await fetch('/api/installments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (response.ok) {
        const updatedInstallment = await response.json();
        setInstallments(prev => 
          prev.map(installment => 
            installment.id === id ? updatedInstallment : installment
          )
        );
        await fetchSummary();
        
        toast({
          title: "Parcelamento atualizado",
          description: "As informações foram atualizadas com sucesso.",
        });
        
        return true;
      } else {
        throw new Error('Failed to update installment');
      }
    } catch (error: any) {
      console.error('Error updating installment:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar parcelamento",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchSummary]);

  const deleteInstallment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/installments?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInstallments(prev => prev.filter(installment => installment.id !== id));
        await fetchSummary();
        
        toast({
          title: "Parcelamento removido",
          description: "O parcelamento foi removido com sucesso.",
        });
        
        return true;
      } else {
        throw new Error('Failed to delete installment');
      }
    } catch (error: any) {
      console.error('Error deleting installment:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover parcelamento",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchSummary]);

  const payInstallment = useCallback(async (
    installmentId: string, 
    installmentNumber: number, 
    paidAmount: number, 
    transactionId?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/installments/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installmentId,
          installmentNumber,
          paidAmount,
          paidDate: new Date().toISOString(),
          transactionId,
        }),
      });

      if (response.ok) {
        await refreshData(); // Recarregar todos os dados
        
        toast({
          title: "Pagamento registrado",
          description: `Parcela ${installmentNumber} foi marcada como paga.`,
        });
        
        return true;
      } else {
        throw new Error('Failed to record payment');
      }
    } catch (error: any) {
      console.error('Error paying installment:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar pagamento",
        variant: "destructive",
      });
      return false;
    }
  }, [refreshData, toast]);

  const getUpcomingPayments = useCallback(async (days: number = 30): Promise<InstallmentPayment[]> => {
    if (!user?.uid) return [];

    try {
      const response = await fetch(`/api/installments?userId=${user.uid}&action=upcoming&days=${days}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
      return [];
    }
  }, [user?.uid]);

  const getOverduePayments = useCallback(async (): Promise<InstallmentPayment[]> => {
    if (!user?.uid) return [];

    try {
      const response = await fetch(`/api/installments?userId=${user.uid}&action=overdue`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      return [];
    }
  }, [user?.uid]);

  const getMonthlyProjections = useCallback(async (months: number = 12) => {
    if (!user?.uid) return [];

    try {
      const response = await fetch(`/api/installments?userId=${user.uid}&action=projections&months=${months}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching projections:', error);
      return [];
    }
  }, [user?.uid]);

  const value: InstallmentsContextType = {
    installments,
    summary,
    isLoading,
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
    throw new Error('useInstallments must be used within an InstallmentsProvider');
  }
  return context;
}
