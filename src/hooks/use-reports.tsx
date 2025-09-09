// src/hooks/use-reports.tsx
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { getSmartMonthlyReport, getSmartAnnualReport } from "@/services/ai-automation-service";
import { useTransactions } from "./use-transactions";
import { startOfMonth, subMonths, getYear, getMonth, isToday, addMonths } from "date-fns";
import { Report } from '@/core/ports/reports.port';

interface ReportsContextType {
  monthlyReports: Report[];
  annualReports: Report[];
  isLoading: boolean;
  getMonthlyReport: (year: number, month: number) => Report | undefined;
  getAnnualReport: (year: number) => Report | undefined;
  generateMonthlyReport: (year: number, month: number, force?: boolean) => Promise<Report | null>;
  generateAnnualReport: (year: number, force?: boolean) => Promise<Report | null>;
  getLatestReport: (type: 'monthly' | 'annual') => Promise<Report | null>;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gastometria_last_report_check';

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { allTransactions, isLoading: isLoadingTransactions } = useTransactions();
  const [monthlyReports, setMonthlyReports] = useState<Report[]>([]);
  const [annualReports, setAnnualReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para gerar período no formato correto
  const generatePeriod = useCallback((date: Date, type: 'monthly' | 'annual'): string => {
    if (type === 'annual') {
      return date.getFullYear().toString();
    } else {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    }
  }, []);

  const fetchReports = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Buscar relatórios mensais
      const monthlyResponse = await fetch(`/api/reports?userId=${user.uid}&type=monthly`);
      if (monthlyResponse.ok) {
        const monthly = await monthlyResponse.json();
        setMonthlyReports(Array.isArray(monthly) ? monthly : []);
      }

      // Buscar relatórios anuais
      const annualResponse = await fetch(`/api/reports?userId=${user.uid}&type=annual`);
      if (annualResponse.ok) {
        const annual = await annualResponse.json();
        setAnnualReports(Array.isArray(annual) ? annual : []);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  }, [user?.uid]);

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
        await fetchReports();
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [user, authLoading]); // Remove fetchReports from dependencies to prevent infinite loop
  
  const generateMonthlyReport = useCallback(async (year: number, month: number, force: boolean = false): Promise<Report | null> => {
    if (!user) return null;
    
    const targetDate = new Date(year, month - 1, 1);
    const period = generatePeriod(targetDate, 'monthly');
    
    // Verificar se já existe (exceto se for forçado)
    if (!force) {
      const existingReport = monthlyReports.find(r => r.period === period);
      if (existingReport) {
        return existingReport;
      }
    }
    
    try {
      let dataForAI: string;
      let previousContext: any = null;

      if (month === 1) {
        // JANEIRO: Baseado no relatório anual do ano anterior + transações de dezembro do ano anterior
        const previousYear = year - 1;
        const annualReport = annualReports.find(r => r.period === previousYear.toString());
        
        // Buscar transações de dezembro do ano anterior
        const decemberStart = new Date(previousYear, 11, 1); // Dezembro = mês 11
        const decemberEnd = new Date(previousYear, 11, 31, 23, 59, 59);
        
        const decemberTransactions = allTransactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= decemberStart && tDate <= decemberEnd;
        });

        dataForAI = JSON.stringify({
          annualReport: annualReport?.data || null,
          decemberTransactions
        }, null, 2);

        previousContext = annualReport;
      } else {
        // OUTROS MESES: Baseado no relatório do mês anterior + transações do mês atual
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevPeriod = generatePeriod(new Date(prevYear, prevMonth - 1, 1), 'monthly');
        const previousMonthReport = monthlyReports.find(r => r.period === prevPeriod);
        
        // Buscar transações do mês atual
        const start = startOfMonth(targetDate);
        const end = new Date(year, month, 0, 23, 59, 59);
        
        const currentMonthTransactions = allTransactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= start && tDate <= end;
        });

        if (currentMonthTransactions.length === 0) {
          console.log('Nenhuma transação encontrada para o período');
          return null;
        }

        dataForAI = JSON.stringify({
          previousMonthReport: previousMonthReport?.data || null,
          currentMonthTransactions
        }, null, 2);

        previousContext = previousMonthReport;
      }
      
      const aiResult = await getSmartMonthlyReport({
        transactions: dataForAI,
        year: String(year),
        month: String(month).padStart(2, '0'),
        previousMonthReport: previousContext ? JSON.stringify(previousContext.data) : undefined,
      }, user.uid, force);
      
      const reportData: Report['data'] = {
        totalIncome: aiResult.totalIncome || 0,
        totalExpense: aiResult.totalExpense || 0,
        balance: aiResult.balance || 0,
        categoryBreakdown: aiResult.categoryBreakdown || [],
        topCategories: aiResult.topCategories || [],
        dailyAverages: aiResult.dailyAverages || { income: 0, expense: 0 },
        transactionCount: aiResult.transactionCount || { income: 0, expense: 0, total: 0 },
        summary: aiResult.summary || '',
      };

      // Salvar relatório via API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          type: 'monthly',
          period,
          data: reportData,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar relatório');
      }

      const newReport = await response.json();
      
      // Atualizar lista local
      setMonthlyReports(prev => {
        const filtered = prev.filter(r => r.period !== period);
        return [newReport, ...filtered].sort((a, b) => b.period.localeCompare(a.period));
      });
      
      return newReport;

    } catch (error) {
      console.error("Failed to generate monthly report:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório mensal",
        variant: "destructive",
      });
      return null;
    }
  }, [user, allTransactions, monthlyReports, annualReports, generatePeriod, toast]);

  const generateAnnualReport = useCallback(async (year: number, force: boolean = false): Promise<Report | null> => {
    if (!user) return null;
    
    const period = year.toString();
    
    // Verificar se já existe (exceto se for forçado)
    if (!force) {
      const existingReport = annualReports.find(r => r.period === period);
      if (existingReport) {
        return existingReport;
      }
    }
    
    try {
      // RELATÓRIO ANUAL: Baseado nos 12 relatórios mensais do ano + transações de dezembro
      
      // Buscar todos os 12 relatórios mensais do ano
      const monthlyReportsForYear: Report[] = [];
      for (let month = 1; month <= 12; month++) {
        const monthPeriod = generatePeriod(new Date(year, month - 1, 1), 'monthly');
        const monthReport = monthlyReports.find(r => r.period === monthPeriod);
        if (monthReport) {
          monthlyReportsForYear.push(monthReport);
        }
      }

      // Buscar transações de dezembro do ano
      const decemberStart = new Date(year, 11, 1); // Dezembro = mês 11
      const decemberEnd = new Date(year, 11, 31, 23, 59, 59);
      
      const decemberTransactions = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= decemberStart && tDate <= decemberEnd;
      });

      // Verificar se temos dados suficientes
      if (monthlyReportsForYear.length === 0 && decemberTransactions.length === 0) {
        console.log('Nenhum relatório mensal ou transação de dezembro encontrados para o ano');
        return null;
      }
      
      const aiResult = await getSmartAnnualReport({
        monthlyReports: JSON.stringify(monthlyReportsForYear.map(r => r.data), null, 2),
        year: String(year),
        decemberTransactions: JSON.stringify(decemberTransactions, null, 2),
      }, user.uid, force);
      
      const reportData: Report['data'] = {
        totalIncome: aiResult.totalIncome || 0,
        totalExpense: aiResult.totalExpense || 0,
        balance: aiResult.balance || 0,
        categoryBreakdown: aiResult.categoryBreakdown || [],
        topCategories: aiResult.topCategories || [],
        dailyAverages: aiResult.dailyAverages || { income: 0, expense: 0 },
        transactionCount: aiResult.transactionCount || { income: 0, expense: 0, total: 0 },
        summary: aiResult.summary || '',
      };

      // Salvar relatório via API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          type: 'annual',
          period,
          data: reportData,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar relatório');
      }

      const newReport = await response.json();
      
      // Atualizar lista local
      setAnnualReports(prev => {
        const filtered = prev.filter(r => r.period !== period);
        return [newReport, ...filtered].sort((a, b) => b.period.localeCompare(a.period));
      });
      
      return newReport;

    } catch (error) {
      console.error("Failed to generate annual report:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório anual",
        variant: "destructive",
      });
      return null;
    }
  }, [user, allTransactions, monthlyReports, annualReports, generatePeriod, toast]);

  const getLatestReport = useCallback(async (type: 'monthly' | 'annual'): Promise<Report | null> => {
    if (!user?.uid) return null;

    try {
      const response = await fetch(`/api/reports?userId=${user.uid}&type=${type}&latest=true`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data || null;
    } catch (err) {
      console.error('Failed to fetch latest report:', err);
      return null;
    }
  }, [user?.uid]);

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
      const period = generatePeriod(lastMonthDate, 'monthly');

      const isReportMissing = !monthlyReports.find(r => r.period === period);

      if (isReportMissing) {
        await generateMonthlyReport(reportYear, reportMonth);
      }
      
      const lastYear = getYear(now) - 1;
      const annualPeriod = lastYear.toString();
      const isAnnualReportMissing = !annualReports.find(r => r.period === annualPeriod);
      const monthlyForLastYear = monthlyReports.filter(r => r.period.startsWith(annualPeriod + '-'));

      if (isAnnualReportMissing && monthlyForLastYear.length >= 6) { // Pelo menos 6 meses
        await generateAnnualReport(lastYear);
      }

      // Mark as run for today
      localStorage.setItem(LOCAL_STORAGE_KEY, new Date().toISOString());
    };

    runAutomaticGeneration();

  }, [isLoading, isLoadingTransactions, user, monthlyReports, annualReports, authLoading]); // Remove function dependencies to prevent loop

  const getMonthlyReport = (year: number, month: number) => {
    const period = `${year}-${String(month).padStart(2, '0')}`;
    return monthlyReports.find(r => r.period === period);
  }

  const getAnnualReport = (year: number) => {
    const period = year.toString();
    return annualReports.find(r => r.period === period);
  }

  const value: ReportsContextType = {
    monthlyReports,
    annualReports,
    isLoading: isLoading || authLoading || isLoadingTransactions,
    getMonthlyReport,
    getAnnualReport,
    generateMonthlyReport,
    generateAnnualReport,
    getLatestReport,
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
