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
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  const plan = useMemo(() => user?.plan || 'Básico', [user]);

  const value: PlanContextType = {
    plan,
    isLoading: authLoading,
    isPro: plan === 'Pro' || plan === 'Plus' || plan === 'Infinity',
    isPlus: plan === 'Plus' || plan === 'Infinity',
    isInfinity: plan === 'Infinity',
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
