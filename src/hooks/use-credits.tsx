// src/hooks/use-credits.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { AICreditLog } from "@/ai/ai-types";
import { getDatabaseAdapter } from "@/services/database/database-service";
import { UserProfile } from "@/lib/types";

interface CreditsContextType {
  credits: number;
  logs: AICreditLog[];
  isLoading: boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState(0);
  const [logs, setLogs] = useState<AICreditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dbAdapter = getDatabaseAdapter();

  // Listener for user's credit balance
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setCredits(0);
      setLogs([]);
      return () => {};
    }

    const unsubscribeUser = dbAdapter.listenToCollection<UserProfile>(
      'users',
      (users) => {
        const currentUserProfile = users.find(u => u.uid === user.uid);
        if (currentUserProfile) {
          setCredits(currentUserProfile.aiCredits || 0);
        }
        setIsLoading(false);
      }
    );
    
    // Listener for credit logs
    const unsubscribeLogs = dbAdapter.listenToCollection<AICreditLog>(
        `users/USER_ID/aiCreditLogs`,
        (fetchedLogs) => {
            setLogs(fetchedLogs);
        }
    );

    return () => {
        unsubscribeUser();
        unsubscribeLogs();
    };
  }, [user, toast, dbAdapter]);


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
