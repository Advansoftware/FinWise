// src/hooks/use-reports.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { MonthlyReport, AnnualReport, Transaction } from "@/lib/types";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getSmartMonthlyReport, getSmartAnnualReport } from "@/services/ai-automation-service";
import { useTransactions } from "./use-transactions";
import { startOfMonth, subMonths, getYear, getMonth, isToday } from "date-fns";
import { apiClient } from "@/lib/api-client";

interface ReportsContextType {
  monthlyReports: MonthlyReport[];
  annualReports: AnnualReport[];
  isLoading: boolean;
  getMonthlyReport: (year: number, month: number) => MonthlyReport | undefined;
  getAnnualReport: (year: number) => AnnualReport | undefined;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gastometria_last_report_check';

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { allTransactions, isLoading: isLoadingTransactions } = useTransactions();
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [annualReports, setAnnualReports] = useState<AnnualReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      setMonthlyReports([]);
      setAnnualReports([]);
      return;
    }

    const loadReports = async () => {
      setIsLoading(true);
      try {
        // Load monthly and annual reports from settings
        const settings = await apiClient.get('settings', user.uid);
        const monthlyFromStorage = settings?.monthlyReports || [];
        setMonthlyReports(monthlyFromStorage);
        
        const annualFromStorage = settings?.annualReports || [];
        setAnnualReports(annualFromStorage);
        
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [user, authLoading]);
  
  const generateMonthlyReport = useCallback(async (year: number, month: number, transactions: Transaction[], previousMonthReport?: MonthlyReport) => {
      if(!user) return null;
      
      const reportId = `${year}-${String(month).padStart(2, '0')}`;
      
      try {
        const aiResult = await getSmartMonthlyReport({
            transactions: JSON.stringify(transactions, null, 2),
            year: String(year),
            month: String(month).padStart(2, '0'),
            previousMonthReport: previousMonthReport ? JSON.stringify(previousMonthReport) : undefined,
        }, user.uid, true);
        
        const newReport: MonthlyReport = {
            ...aiResult,
            id: reportId,
            userId: user.uid,
            year,
            month,
            generatedAt: new Date().toISOString()
        }

        // Save to settings
        const currentSettings = await apiClient.get('settings', user.uid) || {};
        const updatedMonthlyReports = [...(currentSettings.monthlyReports || []), newReport];
        
        await apiClient.update('settings', user.uid, {
          ...currentSettings,
          monthlyReports: updatedMonthlyReports
        });
        
        setMonthlyReports(updatedMonthlyReports);
        
        return newReport;

      } catch (error) {
          console.error("Failed to generate monthly report:", error);
          return null;
      }
  }, [user]);

   const generateAnnualReport = useCallback(async (year: number, monthlyReportsForYear: MonthlyReport[]) => {
      if(!user) return null;
      
      const reportId = String(year);
      
      try {
        const aiResult = await getSmartAnnualReport({
            monthlyReports: JSON.stringify(monthlyReportsForYear, null, 2),
            year: String(year),
        }, user.uid, true);
        
        const newReport: AnnualReport = {
            ...aiResult,
            id: reportId,
            userId: user.uid,
            year,
            generatedAt: new Date().toISOString()
        }

        // Save to settings
        const currentSettings = await apiClient.get('settings', user.uid) || {};
        const updatedAnnualReports = [...(currentSettings.annualReports || []), newReport];
        
        await apiClient.update('settings', user.uid, {
          ...currentSettings,
          annualReports: updatedAnnualReports
        });
        
        setAnnualReports(updatedAnnualReports);
        
        return newReport;

      } catch (error) {
          console.error("Failed to generate annual report:", error);
          return null;
      }
  }, [user]);

  // Effect for automatic report generation
  useEffect(() => {
    if (isLoading || isLoadingTransactions || authLoading || !user) {
        return;
    }
    
    // Check if generation has run today
    const lastCheckString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (lastCheckString && isToday(new Date(lastCheckString))) {
        return; // Already ran today
    }

    const runAutomaticGeneration = async () => {
        const now = new Date();
        const lastMonthDate = subMonths(now, 1);
        const reportYear = getYear(lastMonthDate);
        const reportMonth = getMonth(lastMonthDate) + 1; // 1-12
        const reportId = `${reportYear}-${String(reportMonth).padStart(2, '0')}`;

        const isReportMissing = !monthlyReports.find(r => r.id === reportId);

        if (isReportMissing) {
            const start = startOfMonth(lastMonthDate);
            const end = new Date(reportYear, reportMonth, 0, 23, 59, 59); // End of the month

            const transactionsForMonth = allTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= start && tDate <= end;
            });

            // Find previous month's report
            const prevMonthDate = subMonths(lastMonthDate, 1);
            const prevReportYear = getYear(prevMonthDate);
            const prevReportMonth = getMonth(prevMonthDate) + 1;
            const prevReportId = `${prevReportYear}-${String(prevReportMonth).padStart(2, '0')}`;
            const previousMonthReport = monthlyReports.find(r => r.id === prevReportId);
            
            if (transactionsForMonth.length > 0) {
                 await generateMonthlyReport(reportYear, reportMonth, transactionsForMonth, previousMonthReport);
            }
        }
        
        const lastYear = getYear(now) - 1;
        const isAnnualReportMissing = !annualReports.find(r => r.year === lastYear);
        const monthlyForLastYear = monthlyReports.filter(r => r.year === lastYear);

        if (isAnnualReportMissing && monthlyForLastYear.length === 12) {
            await generateAnnualReport(lastYear, monthlyForLastYear);
        }

        // Mark as run for today
        localStorage.setItem(LOCAL_STORAGE_KEY, new Date().toISOString());
    };

    runAutomaticGeneration();

  }, [isLoading, isLoadingTransactions, user, allTransactions, monthlyReports, annualReports, generateAnnualReport, generateMonthlyReport, authLoading]);

  const getMonthlyReport = (year: number, month: number) => {
      const reportId = `${year}-${String(month).padStart(2, '0')}`;
      return monthlyReports.find(r => r.id === reportId);
  }

  const getAnnualReport = (year: number) => {
      return annualReports.find(r => r.year === year);
  }

  const value: ReportsContextType = {
    monthlyReports,
    annualReports,
    isLoading: isLoading || authLoading || isLoadingTransactions,
    getMonthlyReport,
    getAnnualReport,
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
