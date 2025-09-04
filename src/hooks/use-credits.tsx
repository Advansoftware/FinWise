// src/hooks/use-credits.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { AICreditLog } from "@/ai/ai-types";
import { getDatabaseAdapter } from "@/services/database/database-service";

interface CreditsContextType {
  credits: number;
  logs: AICreditLog[];
  isLoading: boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AICreditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dbAdapter = useMemo(() => getDatabaseAdapter(), []);

  const credits = useMemo(() => user?.aiCredits || 0, [user]);

  // Listener for credit logs
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setLogs([]);
      return;
    }

    setIsLoading(true);
    
    // Listener for credit logs
    const unsubscribeLogs = dbAdapter.listenToCollection<AICreditLog>(
        `users/${user.uid}/aiCreditLogs`,
        (fetchedLogs) => {
            setLogs(fetchedLogs);
            setIsLoading(false);
        },
        [dbAdapter.queryConstraint('orderBy', 'timestamp', 'desc')]
    );

    return () => {
        unsubscribeLogs();
    };
  }, [user, authLoading, dbAdapter]);


  const value: CreditsContextType = {
    credits,
    logs,
    isLoading: authLoading || isLoading,
  };

  return (
    <CreditsContext.Provider value={value}>
        {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}
