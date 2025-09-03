
// src/hooks/use-credits.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { doc, onSnapshot, Unsubscribe, collection, query, orderBy } from "firebase/firestore";
import { useToast } from "./use-toast";
import { AICreditLog } from "@/ai/ai-types";

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

  // Listener for user's credit balance
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setCredits(0);
      return;
    }

    const { db } = getFirebase();
    const userDocRef = doc(db, "users", user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCredits(data.aiCredits || 0);
      }
      setIsLoading(false);
    }, (error) => {
       console.error("Failed to fetch credits:", error);
       toast({ variant: "destructive", title: "Erro ao Carregar Saldo de Créditos" });
       setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  // Listener for credit logs
  useEffect(() => {
    if (!user) {
      setLogs([]);
      return;
    }
    
    const { db } = getFirebase();
    const logsQuery = query(
      collection(db, "users", user.uid, "aiCreditLogs"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(logsQuery, (querySnapshot) => {
      const fetchedLogs: AICreditLog[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as AICreditLog);
      });
      setLogs(fetchedLogs);
    });

    return () => unsubscribe();

  }, [user]);

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
