
// src/hooks/use-plan.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { useAuth } from "./use-auth";
import { UserPlan } from "@/lib/types";
import { getPlanAction } from "@/app/actions";

interface PlanContextType {
  plan: UserPlan;
  isLoading: boolean;
  isPro: boolean;
  isPlus: boolean;
  refetchPlan: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<UserPlan>('Básico');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) {
        setPlan('Básico');
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
        const userPlan = await getPlanAction(user.uid);
        setPlan(userPlan);
    } catch (e) {
        console.error("Failed to fetch user plan", e);
        setPlan('Básico'); // Fallback to basic plan on error
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchPlan();
    }
  }, [authLoading, fetchPlan]);

  const value: PlanContextType = {
    plan,
    isLoading: authLoading || isLoading,
    isPro: plan === 'Pro' || plan === 'Plus',
    isPlus: plan === 'Plus',
    refetchPlan: fetchPlan,
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
