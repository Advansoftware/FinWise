// src/hooks/use-reports.tsx
"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { useDataRefresh } from "./use-data-refresh";
import {
  getSmartMonthlyReport,
  getSmartAnnualReport,
} from "@/services/ai-automation-service";
import { useTransactions } from "./use-transactions";
import { startOfMonth, subMonths, getYear, getMonth, isToday } from "date-fns";
import { Report } from "@/core/ports/reports.port";
import { offlineStorage } from "@/lib/offline-storage";

interface ReportsContextType {
  monthlyReports: Report[];
  annualReports: Report[];
  isLoading: boolean;
  isOnline: boolean;
  getMonthlyReport: (year: number, month: number) => Report | undefined;
  getAnnualReport: (year: number) => Report | undefined;
  generateMonthlyReport: (
    year: number,
    month: number,
    force?: boolean
  ) => Promise<Report | null>;
  generateAnnualReport: (
    year: number,
    force?: boolean
  ) => Promise<Report | null>;
  getLatestReport: (type: "monthly" | "annual") => Promise<Report | null>;
  refreshReports: () => Promise<void>;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "gastometria_last_report_check";

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { allTransactions, isLoading: isLoadingTransactions } =
    useTransactions();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();
  const [monthlyReports, setMonthlyReports] = useState<Report[]>([]);
  const [annualReports, setAnnualReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Função para gerar período no formato correto
  const generatePeriod = useCallback(
    (date: Date, type: "monthly" | "annual"): string => {
      if (type === "annual") {
        return date.getFullYear().toString();
      } else {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        return `${year}-${month}`;
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      let monthlyData: Report[] = [];
      let annualData: Report[] = [];

      if (isOnline) {
        // Online: fetch from server and cache
        const [monthlyResponse, annualResponse] = await Promise.all([
          fetch(`/api/reports?userId=${user.uid}&type=monthly`),
          fetch(`/api/reports?userId=${user.uid}&type=annual`),
        ]);

        if (monthlyResponse.ok) {
          const contentType = monthlyResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            monthlyData = await monthlyResponse.json();
            monthlyData = Array.isArray(monthlyData) ? monthlyData : [];
            // Cache monthly reports
            await offlineStorage.saveSetting(
              `monthly_reports_${user.uid}`,
              monthlyData
            );
          }
        }

        if (annualResponse.ok) {
          const contentType = annualResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            annualData = await annualResponse.json();
            annualData = Array.isArray(annualData) ? annualData : [];
            // Cache annual reports
            await offlineStorage.saveSetting(
              `annual_reports_${user.uid}`,
              annualData
            );
          }
        }
      } else {
        // Offline: load from cache
        monthlyData =
          (await offlineStorage.getSetting<Report[]>(
            `monthly_reports_${user.uid}`
          )) || [];
        annualData =
          (await offlineStorage.getSetting<Report[]>(
            `annual_reports_${user.uid}`
          )) || [];
      }

      setMonthlyReports(monthlyData);
      setAnnualReports(annualData);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      if (!isOnline) {
        // Try offline fallback
        try {
          const offlineMonthly =
            (await offlineStorage.getSetting<Report[]>(
              `monthly_reports_${user.uid}`
            )) || [];
          const offlineAnnual =
            (await offlineStorage.getSetting<Report[]>(
              `annual_reports_${user.uid}`
            )) || [];
          setMonthlyReports(offlineMonthly);
          setAnnualReports(offlineAnnual);
        } catch (offlineError) {
          console.error("Erro ao carregar relatórios offline:", offlineError);
        }
      }
    }
  }, [user?.uid, isOnline]);

  useEffect(() => {
    const refreshHandler = () => {
      if (user && !authLoading) {
        loadData();
      }
    };

    registerRefreshHandler("reports", refreshHandler);

    return () => {
      unregisterRefreshHandler("reports");
    };
  }, [
    user,
    authLoading,
    registerRefreshHandler,
    unregisterRefreshHandler,
    loadData,
  ]);

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
        await loadData();
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [user, authLoading, loadData]);

  const generateMonthlyReport = useCallback(
    async (
      year: number,
      month: number,
      force: boolean = false
    ): Promise<Report | null> => {
      if (!user) return null;

      const targetDate = new Date(year, month - 1, 1);
      const period = generatePeriod(targetDate, "monthly");

      // Verificar se já existe (exceto se for forçado)
      if (!force) {
        const existingReport = monthlyReports.find((r) => r.period === period);
        if (existingReport) {
          return existingReport;
        }
      }

      try {
        if (!isOnline) {
          toast({
            title: "📡 Offline",
            description:
              "Relatórios só podem ser gerados quando você estiver online",
            variant: "error",
          });
          return null;
        }

        const aiResult = await getSmartMonthlyReport(
          {
            transactions: JSON.stringify(allTransactions, null, 2),
            year: String(year),
            month: String(month).padStart(2, "0"),
          },
          user.uid,
          force
        );

        const reportData: Report["data"] = {
          totalIncome: aiResult.totalIncome || 0,
          totalExpense: aiResult.totalExpense || 0,
          balance: aiResult.balance || 0,
          categoryBreakdown: aiResult.categoryBreakdown || [],
          topCategories: aiResult.topCategories || [],
          dailyAverages: aiResult.dailyAverages || { income: 0, expense: 0 },
          transactionCount: aiResult.transactionCount || {
            income: 0,
            expense: 0,
            total: 0,
          },
          summary: aiResult.summary || "",
        };

        // Salvar relatório via API
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.uid,
            type: "monthly",
            period,
            data: reportData,
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao salvar relatório");
        }

        const newReport = await response.json();

        // Atualizar lista local e cache
        const updatedReports = [
          newReport,
          ...monthlyReports.filter((r) => r.period !== period),
        ].sort((a, b) => b.period.localeCompare(a.period));

        setMonthlyReports(updatedReports);
        await offlineStorage.saveSetting(
          `monthly_reports_${user.uid}`,
          updatedReports
        );

        triggerRefresh();

        return newReport;
      } catch (error) {
        console.error("Failed to generate monthly report:", error);
        toast({
          title: "Erro",
          description: "Falha ao gerar relatório mensal",
          variant: "error",
        });
        return null;
      }
    },
    [user, allTransactions, monthlyReports, generatePeriod, toast, isOnline]
  );

  const generateAnnualReport = useCallback(
    async (year: number, force: boolean = false): Promise<Report | null> => {
      if (!user) return null;

      const period = year.toString();

      // Verificar se já existe (exceto se for forçado)
      if (!force) {
        const existingReport = annualReports.find((r) => r.period === period);
        if (existingReport) {
          return existingReport;
        }
      }

      try {
        if (!isOnline) {
          toast({
            title: "📡 Offline",
            description:
              "Relatórios só podem ser gerados quando você estiver online",
            variant: "error",
          });
          return null;
        }

        // Buscar todos os 12 relatórios mensais do ano
        const monthlyReportsForYear: Report[] = [];
        for (let month = 1; month <= 12; month++) {
          const monthPeriod = generatePeriod(
            new Date(year, month - 1, 1),
            "monthly"
          );
          const monthReport = monthlyReports.find(
            (r) => r.period === monthPeriod
          );
          if (monthReport) {
            monthlyReportsForYear.push(monthReport);
          }
        }

        const aiResult = await getSmartAnnualReport(
          {
            monthlyReports: JSON.stringify(
              monthlyReportsForYear.map((r) => r.data),
              null,
              2
            ),
            year: String(year),
            decemberTransactions: JSON.stringify([], null, 2),
          },
          user.uid,
          force
        );

        const reportData: Report["data"] = {
          totalIncome: aiResult.totalIncome || 0,
          totalExpense: aiResult.totalExpense || 0,
          balance: aiResult.balance || 0,
          categoryBreakdown: aiResult.categoryBreakdown || [],
          topCategories: aiResult.topCategories || [],
          dailyAverages: aiResult.dailyAverages || { income: 0, expense: 0 },
          transactionCount: aiResult.transactionCount || {
            income: 0,
            expense: 0,
            total: 0,
          },
          summary: aiResult.summary || "",
        };

        // Salvar relatório via API
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.uid,
            type: "annual",
            period,
            data: reportData,
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao salvar relatório");
        }

        const newReport = await response.json();

        // Atualizar lista local e cache
        const updatedReports = [
          newReport,
          ...annualReports.filter((r) => r.period !== period),
        ].sort((a, b) => b.period.localeCompare(a.period));

        setAnnualReports(updatedReports);
        await offlineStorage.saveSetting(
          `annual_reports_${user.uid}`,
          updatedReports
        );

        triggerRefresh();

        return newReport;
      } catch (error) {
        console.error("Failed to generate annual report:", error);
        toast({
          title: "Erro",
          description: "Falha ao gerar relatório anual",
          variant: "error",
        });
        return null;
      }
    },
    [user, monthlyReports, annualReports, generatePeriod, toast, isOnline]
  );

  const getLatestReport = useCallback(
    async (type: "monthly" | "annual"): Promise<Report | null> => {
      if (!user?.uid) return null;

      try {
        if (isOnline) {
          const response = await fetch(
            `/api/reports?userId=${user.uid}&type=${type}&latest=true`
          );

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          return data || null;
        } else {
          // Offline: get latest from cache
          const cachedReports =
            type === "monthly" ? monthlyReports : annualReports;
          return cachedReports.length > 0 ? cachedReports[0] : null;
        }
      } catch (err) {
        console.error("Failed to fetch latest report:", err);
        return null;
      }
    },
    [user?.uid, monthlyReports, annualReports, isOnline]
  );

  const refreshReports = async () => {
    await loadData();
  };

  const getMonthlyReport = (year: number, month: number) => {
    const period = `${year}-${String(month).padStart(2, "0")}`;
    return monthlyReports.find((r) => r.period === period);
  };

  const getAnnualReport = (year: number) => {
    const period = year.toString();
    return annualReports.find((r) => r.period === period);
  };

  const value: ReportsContextType = {
    monthlyReports,
    annualReports,
    isLoading: isLoading || authLoading || isLoadingTransactions,
    isOnline,
    getMonthlyReport,
    getAnnualReport,
    generateMonthlyReport,
    generateAnnualReport,
    getLatestReport,
    refreshReports,
  };

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
}
