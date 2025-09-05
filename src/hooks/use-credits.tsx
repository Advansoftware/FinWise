// src/hooks/use-credits.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { AICreditLog } from "@/ai/ai-types";
import { apiClient } from "@/lib/api-client";

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

  const credits = useMemo(() => user?.aiCredits || 0, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setLogs([]);
      return;
    }

    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const fetchedLogs = await apiClient.get('aiCreditLogs', user.uid);
        setLogs(fetchedLogs);
      } catch (error) {
        console.error('Erro ao carregar logs de créditos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [user, authLoading]);

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
