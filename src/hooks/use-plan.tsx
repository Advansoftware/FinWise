// src/hooks/use-plan.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { UserPlan } from "@/lib/types";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";

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
  const [plan, setPlan] = useState<UserPlan>('Básico');
  const [isLoading, setIsLoading] = useState(true);

  // The realtime listener is the single source of truth for the user's plan.
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to be ready
    }
    
    if (!user) {
        setPlan('Básico');
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const { db } = getFirebase();
    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if(doc.exists()) {
            setPlan(doc.data().plan || 'Básico');
        } else {
            setPlan('Básico');
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to listen to user plan changes:", error);
        setPlan('Básico'); // Fallback on error
        setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount

  }, [authLoading, user]);

  const value: PlanContextType = {
    plan,
    isLoading: authLoading || isLoading,
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
