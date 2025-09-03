
// src/hooks/use-reports.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { MonthlyReport, AnnualReport, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getFirebase } from "@/lib/firebase";
import { collection, doc, setDoc, onSnapshot, Unsubscribe, query } from "firebase/firestore";
import { generateMonthlyReportAction, generateAnnualReportAction } from "@/app/actions";

interface ReportsContextType {
  monthlyReports: MonthlyReport[];
  annualReports: AnnualReport[];
  isLoading: boolean;
  getMonthlyReport: (year: number, month: number) => MonthlyReport | undefined;
  getAnnualReport: (year: number) => AnnualReport | undefined;
  generateMonthlyReport: (year: number, month: number, transactions: Transaction[]) => Promise<MonthlyReport | null>;
  generateAnnualReport: (year: number, monthlyReportsForYear: MonthlyReport[]) => Promise<AnnualReport | null>;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [annualReports, setAnnualReports] = useState<AnnualReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listener for monthly reports
  useEffect(() => {
    if (!user) {
      setIsLoading(true);
      setMonthlyReports([]);
      setAnnualReports([]);
      return;
    }

    const { db } = getFirebase();
    const monthlyQuery = query(collection(db, "users", user.uid, "reports"));
    const annualQuery = query(collection(db, "users", user.uid, "annualReports"));

    const unsubscribeMonthly = onSnapshot(monthlyQuery, (querySnapshot) => {
      const fetchedReports: MonthlyReport[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReports.push(doc.data() as MonthlyReport);
      });
      setMonthlyReports(fetchedReports);
      setIsLoading(false);
    }, (error) => {
       console.error("Failed to fetch monthly reports:", error);
       toast({ variant: "destructive", title: "Erro ao Carregar Relatórios Mensais" });
       setIsLoading(false);
    });

    const unsubscribeAnnual = onSnapshot(annualQuery, (querySnapshot) => {
      const fetchedReports: AnnualReport[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReports.push(doc.data() as AnnualReport);
      });
      setAnnualReports(fetchedReports);
    }, (error) => {
       console.error("Failed to fetch annual reports:", error);
       toast({ variant: "destructive", title: "Erro ao Carregar Relatórios Anuais" });
    });

    return () => {
        unsubscribeMonthly();
        unsubscribeAnnual();
    };
  }, [user, toast]);
  
  const getMonthlyReport = (year: number, month: number) => {
      const reportId = `${year}-${String(month).padStart(2, '0')}`;
      return monthlyReports.find(r => r.id === reportId);
  }

  const getAnnualReport = (year: number) => {
      return annualReports.find(r => r.year === year);
  }

  const generateMonthlyReport = async (year: number, month: number, transactions: Transaction[]) => {
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
            year,
            month,
            generatedAt: new Date().toISOString()
        }

        const { db } = getFirebase();
        const reportRef = doc(db, "users", user.uid, "reports", reportId);
        await setDoc(reportRef, newReport);
        
        toast({ title: "Relatório mensal gerado com sucesso!" });
        return newReport;

      } catch (error) {
          console.error("Failed to generate monthly report:", error);
          toast({ variant: "destructive", title: "Erro ao Gerar Relatório Mensal", description: "Não foi possível conectar com a IA. Verifique suas configurações." });
          return null;
      }
  }

   const generateAnnualReport = async (year: number, monthlyReportsForYear: MonthlyReport[]) => {
      if(!user) return null;
      
      const reportId = String(year);
      
      try {
        const aiResult = await generateAnnualReportAction({
            monthlyReports: JSON.stringify(monthlyReportsForYear, null, 2),
            year: String(year),
        }, user.uid);
        
        const newReport: AnnualReport = {
            ...aiResult,
            id: reportId,
            userId: user.uid,
            year,
            generatedAt: new Date().toISOString()
        }

        const { db } = getFirebase();
        const reportRef = doc(db, "users", user.uid, "annualReports", reportId);
        await setDoc(reportRef, newReport);
        
        toast({ title: `Relatório anual de ${year} gerado com sucesso!` });
        return newReport;

      } catch (error) {
          console.error("Failed to generate annual report:", error);
          toast({ variant: "destructive", title: "Erro ao Gerar Relatório Anual", description: "Não foi possível conectar com a IA. Verifique suas configurações." });
          return null;
      }
  }


  const value: ReportsContextType = {
    monthlyReports,
    annualReports,
    isLoading,
    getMonthlyReport,
    getAnnualReport,
    generateMonthlyReport,
    generateAnnualReport
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
