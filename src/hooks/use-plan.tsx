// src/hooks/use-plan.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "./use-auth";
import { UserPlan } from "@/lib/types";

interface PlanContextType {
  plan: UserPlan;
  isLoading: boolean;
  isPro: boolean;
  isPlus: boolean;
  isInfinity: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiration: number | null;
  periodEnd: Date | null;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  const plan = useMemo(() => user?.plan || 'Básico', [user]);
  
  // Calcular informações de expiração
  const expirationInfo = useMemo(() => {
    if (!user?.stripeCurrentPeriodEnd) {
      return {
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiration: null,
        periodEnd: null
      };
    }

    const periodEnd = new Date(user.stripeCurrentPeriodEnd);
    const now = new Date();
    const diffTime = periodEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isExpired: diffDays < 0,
      isExpiringSoon: diffDays >= 0 && diffDays <= 7, // Menos de 7 dias para vencer
      daysUntilExpiration: diffDays,
      periodEnd
    };
  }, [user?.stripeCurrentPeriodEnd]);

  const value: PlanContextType = {
    plan,
    isLoading: authLoading,
    isPro: plan === 'Pro' || plan === 'Plus' || plan === 'Infinity',
    isPlus: plan === 'Plus' || plan === 'Infinity',
    isInfinity: plan === 'Infinity',
    ...expirationInfo
  };

  return (
    <PlanContext.Provider value={value}>
        {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}
