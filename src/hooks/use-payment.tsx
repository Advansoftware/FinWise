// src/hooks/use-payment.tsx
'use client';

import { useState } from 'react';
import { paymentClient } from '@/lib/payment-client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { UserPlan } from '@/lib/types';

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createCheckoutSession = async (plan: Exclude<UserPlan, 'Básico'>) => {
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    setIsProcessing(true);
    try {
      const result = await paymentClient.createCheckoutSession({
        userId: user.uid,
        userEmail: user.email,
        plan: plan
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Checkout',
        description: error.message || 'Não foi possível redirecionar para a página de pagamento. Tente novamente mais tarde.'
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsProcessing(true);
    try {
      const result = await paymentClient.createPortalSession({
        userId: user.uid
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Failed to open customer portal');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível abrir o portal de gerenciamento. Tente novamente mais tarde.'
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    createCheckoutSession,
    openCustomerPortal
  };
}
