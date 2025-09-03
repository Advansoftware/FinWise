
// src/hooks/use-reports.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { MonthlyReport, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { collection, doc, setDoc, onSnapshot, Unsubscribe, query, where, getDoc } from "firebase/firestore";
import { generateMonthlyReportAction } from "@/app/actions";

interface ReportsContextType {
  reports: MonthlyReport[];
  isLoading: boolean;
  getReport: (year: number, month: number) => MonthlyReport | undefined;
  generateReport: (year: number, month: number, transactions: Transaction[]) => Promise<MonthlyReport | null>;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listener for reports
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setReports([]);
      return;
    }

    setIsLoading(true);
    const { db } = getFirebase();
    const q = query(collection(db, "users", user.uid, "reports"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReports: MonthlyReport[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReports.push(doc.data() as MonthlyReport);
      });
      setReports(fetchedReports);
      setIsLoading(false);
    }, (error) => {
       console.error("Failed to fetch reports:", error);
       toast({ variant: "destructive", title: "Erro ao Carregar Relatórios" });
       setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const getReport = (year: number, month: number) => {
      const reportId = `${year}-${String(month).padStart(2, '0')}`;
      return reports.find(r => r.id === reportId);
  }

  const generateReport = async (year: number, month: number, transactions: Transaction[]) => {
      if(!user) return null;
      
      const reportId = `${year}-${String(month).padStart(2, '0')}`;
      
      try {
        const aiResult = await generateMonthlyReportAction({
            transactions: JSON.stringify(transactions, null, 2),
            year: String(year),
            month: String(month).padStart(2, '0')
        }, user.uid);
        
        const newReport: MonthlyReport = {
            ...aiResult,
            id: reportId,
            userId: user.uid,
            generatedAt: new Date().toISOString()
        }

        const { db } = getFirebase();
        const reportRef = doc(db, "users", user.uid, "reports", reportId);
        await setDoc(reportRef, newReport);
        
        toast({ title: "Relatório gerado com sucesso!" });
        return newReport;

      } catch (error) {
          console.error("Failed to generate report:", error);
          toast({ variant: "destructive", title: "Erro ao Gerar Relatório", description: "Não foi possível conectar com a IA. Verifique suas configurações." });
          return null;
      }
  }


  const value: ReportsContextType = {
    reports,
    isLoading,
    getReport,
    generateReport
  };

  return (
    <ReportsContext.Provider value={value}>
        {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
}
