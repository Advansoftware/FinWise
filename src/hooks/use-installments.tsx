// src/hooks/use-installments.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {Installment, InstallmentPayment, InstallmentSummary, CreateInstallmentInput} from '@/core/ports/installments.port';
import {useAuth} from '@/hooks/use-auth';
import {useToast} from '@/hooks/use-toast';
import {offlineStorage} from '@/lib/offline-storage';
import {useDataRefresh} from './use-data-refresh';

interface InstallmentsContextType {
  // State
  installments: Installment[];
  summary: InstallmentSummary | null;
  isLoading: boolean;
  isOnline: boolean;
  
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
  const [isOnline, setIsOnline] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } = useDataRefresh();

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

  const fetchInstallments = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      let data: Installment[];

      if (navigator.onLine) {
        // Online: fetch from server and sync to offline storage
        const response = await fetch(`/api/installments?userId=${user.uid}`);
        if (response.ok) {
          data = await response.json();
          
          // Save to offline storage
          for (const installment of data) {
            await offlineStorage.saveInstallment(installment, true);
          }
        } else {
          throw new Error('Failed to fetch from server');
        }
      } else {
        // Offline: load from offline storage
        data = await offlineStorage.getInstallments(user.uid);
      }

      setInstallments(data);
    } catch (error) {
      console.error('Error fetching installments:', error);
      // Try offline fallback
      try {
        const offlineData = await offlineStorage.getInstallments(user.uid);
        setInstallments(offlineData);
      } catch (offlineError) {
        console.error('Error fetching installments offline:', offlineError);
      }
    }
  }, [user?.uid]);

  const fetchSummary = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      let data: InstallmentSummary;

      if (navigator.onLine) {
        // Online: fetch from server and cache
        const response = await fetch(`/api/installments?userId=${user.uid}&action=summary`);
        if (response.ok) {
          data = await response.json();
          await offlineStorage.saveSetting(`installment_summary_${user.uid}`, data);
        } else {
          throw new Error('Failed to fetch summary from server');
        }
      } else {
        // Offline: load from cache
        data = await offlineStorage.getSetting(`installment_summary_${user.uid}`) || null;
      }

      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      // Try offline fallback
      try {
        const offlineData = await offlineStorage.getSetting(`installment_summary_${user.uid}`);
        setSummary(offlineData || null);
      } catch (offlineError) {
        console.error('Error fetching summary offline:', offlineError);
      }
    }
  }, [user?.uid]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchInstallments(), fetchSummary()]);
    setIsLoading(false);
  }, [fetchInstallments, fetchSummary]);

  useEffect(() => {
    const refreshHandler = () => {
      if (user?.uid) {
        refreshData();
      }
    };

    registerRefreshHandler('installments', refreshHandler);

    return () => {
      unregisterRefreshHandler('installments');
    };
  }, [user?.uid, registerRefreshHandler, unregisterRefreshHandler, refreshData]);

  useEffect(() => {
    if (user?.uid) {
      refreshData();
    }
  }, [user?.uid, refreshData]);

  const createInstallment = useCallback(async (data: CreateInstallmentInput): Promise<Installment | null> => {
    if (!user?.uid) return null;

    // Para parcelamentos recorrentes, o installmentAmount é o valor total (valor mensal/anual)
    // Para parcelamentos normais, é o valor total dividido pelo número de parcelas
    const installmentAmount = data.isRecurring 
      ? data.totalAmount 
      : data.totalAmount / data.totalInstallments;

    const installmentData: Installment = {
      userId: user.uid,
      ...data,
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for offline
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      installmentAmount,
      isActive: true,
      paidInstallments: 0,
      remainingInstallments: data.isRecurring ? 999999 : data.totalInstallments, // Valor alto para recorrentes
      totalPaid: 0,
      remainingAmount: data.isRecurring ? data.totalAmount : data.totalAmount, // Para recorrentes, sempre renovável
      isCompleted: false,
      payments: [],
      // Campos específicos para recorrentes
      adjustmentHistory: data.isRecurring ? [] : undefined,
    };

    try {
      if (navigator.onLine) {
        // Online: create on server
        const response = await fetch('/api/installments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(installmentData),
        });

        if (response.ok) {
          const newInstallment = await response.json();
          await offlineStorage.saveInstallment(newInstallment, true);
          setInstallments(prev => [newInstallment, ...prev]);
          await fetchSummary();
          
          toast({
            title: "Parcelamento criado",
            description: `${data.name} foi adicionado com sucesso.`,
          });
          
          triggerRefresh();
          
          return newInstallment;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create installment');
        }
      } else {
        // Offline: save locally and queue for sync
        await offlineStorage.saveInstallment(installmentData, false);
        await offlineStorage.addPendingAction({
          type: 'create',
          collection: 'installments',
          data: installmentData
        });

        setInstallments(prev => [installmentData, ...prev]);
        
        toast({
          title: "💾 Parcelamento salvo offline",
          description: `${data.name} será sincronizado quando você estiver online.`,
        });
        
        triggerRefresh();
        
        return installmentData;
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
    if (!user?.uid) return false;

    try {
      if (navigator.onLine) {
        // Online: update on server
        const response = await fetch('/api/installments', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, userId: user.uid, ...data }),
        });

        if (response.ok) {
          const updatedInstallment = await response.json();
          await offlineStorage.saveInstallment(updatedInstallment, true);
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
          
          triggerRefresh();
          
          return true;
        } else {
          throw new Error('Failed to update installment');
        }
      } else {
        // Offline: update locally and queue for sync
        const updatedInstallment = installments.find(i => i.id === id);
        if (updatedInstallment) {
          const finalInstallment = { ...updatedInstallment, ...data };
          await offlineStorage.saveInstallment(finalInstallment, false);
          await offlineStorage.addPendingAction({
            type: 'update',
            collection: 'installments',
            data: { id, ...data }
          });
        }

        setInstallments(prev => 
          prev.map(installment => 
            installment.id === id ? { ...installment, ...data } : installment
          )
        );
        
        toast({
          title: "💾 Parcelamento atualizado offline",
          description: "As alterações serão sincronizadas quando você estiver online.",
        });
        
        triggerRefresh();
        
        return true;
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
  }, [toast, fetchSummary, installments]);

  const deleteInstallment = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (navigator.onLine) {
        // Online: delete on server
        const response = await fetch(`/api/installments?id=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await offlineStorage.deleteItem('installments', id);
          setInstallments(prev => prev.filter(installment => installment.id !== id));
          await fetchSummary();
          
          toast({
            title: "Parcelamento removido",
            description: "O parcelamento foi removido com sucesso.",
          });
          
          triggerRefresh();
          
          return true;
        } else {
          throw new Error('Failed to delete installment');
        }
      } else {
        // Offline: mark as deleted and queue for sync
        const installmentToDelete = installments.find(i => i.id === id);
        if (installmentToDelete) {
          await offlineStorage.deleteItem('installments', id);
          await offlineStorage.addPendingAction({
            type: 'delete',
            collection: 'installments',
            data: installmentToDelete
          });
        }

        setInstallments(prev => prev.filter(installment => installment.id !== id));
        
        toast({
          title: "💾 Parcelamento excluído offline",
          description: "A exclusão será sincronizada quando você estiver online.",
        });
        
        triggerRefresh();
        
        return true;
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
  }, [toast, fetchSummary, installments]);

  const payInstallment = useCallback(async (
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
      if (navigator.onLine) {
        // Online: process payment on server
        const response = await fetch('/api/installments/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          throw new Error('Failed to record payment');
        }
      } else {
        // Offline: queue payment for sync
        await offlineStorage.addPendingAction({
          type: 'create',
          collection: 'installment_payments',
          data: paymentData
        });
        
        // Create a complete InstallmentPayment for local state
        const installmentPayment: InstallmentPayment = {
          id: `temp-payment-${Date.now()}-${Math.random()}`,
          installmentId,
          installmentNumber,
          dueDate: new Date().toISOString(), // Will be updated by sync
          scheduledAmount: paidAmount,
          paidAmount,
          paidDate: new Date().toISOString(),
          status: 'paid',
          transactionId
        };
        
        // Update local installment state
        setInstallments(prev => 
          prev.map(installment => {
            if (installment.id === installmentId) {
              const payments = installment.payments || [];
              return {
                ...installment,
                payments: [...payments, installmentPayment],
                paidInstallments: installment.paidInstallments + 1,
                remainingInstallments: installment.remainingInstallments - 1,
                totalPaid: installment.totalPaid + paidAmount,
                remainingAmount: installment.remainingAmount - paidAmount
              };
            }
            return installment;
          })
        );
        
        toast({
          title: "💾 Pagamento salvo offline",
          description: `Parcela ${installmentNumber} será processada quando você estiver online.`,
        });
        
        return true;
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
      if (navigator.onLine) {
        const response = await fetch(`/api/installments?userId=${user.uid}&action=upcoming&days=${days}`);
        if (response.ok) {
          const data = await response.json();
          await offlineStorage.saveSetting(`upcoming_payments_${user.uid}`, data);
          return data;
        }
      } else {
        const cachedData = await offlineStorage.getSetting(`upcoming_payments_${user.uid}`);
        return cachedData || [];
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
      if (navigator.onLine) {
        const response = await fetch(`/api/installments?userId=${user.uid}&action=overdue`);
        if (response.ok) {
          const data = await response.json();
          await offlineStorage.saveSetting(`overdue_payments_${user.uid}`, data);
          return data;
        }
      } else {
        const cachedData = await offlineStorage.getSetting(`overdue_payments_${user.uid}`);
        return cachedData || [];
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
      if (navigator.onLine) {
        const response = await fetch(`/api/installments?userId=${user.uid}&action=projections&months=${months}`);
        if (response.ok) {
          const data = await response.json();
          await offlineStorage.saveSetting(`monthly_projections_${user.uid}`, data);
          return data;
        }
      } else {
        const cachedData = await offlineStorage.getSetting(`monthly_projections_${user.uid}`);
        return cachedData || [];
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
    isOnline,
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
