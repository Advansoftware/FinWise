// src/core/ports/reports.port.ts

export interface Report {
  id: string;
  userId: string;
  type: 'monthly' | 'annual';
  period: string; // '2025-01' para mensal, '2025' para anual
  data: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    topCategories: Array<{
      category: string;
      amount: number;
    }>;
    dailyAverages: {
      income: number;
      expense: number;
    };
    transactionCount: {
      income: number;
      expense: number;
      total: number;
    };
    summary: string; // Resumo gerado pela IA
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportsRepository {
  findByUserId(userId: string): Promise<Report[]>;
  findByUserIdAndType(userId: string, type: 'monthly' | 'annual'): Promise<Report[]>;
  findByUserIdAndPeriod(userId: string, period: string): Promise<Report | null>;
  findLatestByUserIdAndType(userId: string, type: 'monthly' | 'annual'): Promise<Report | null>;
  create(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report>;
  update(id: string, updates: Partial<Report>): Promise<void>;
  delete(id: string): Promise<void>;
  // Removida a função de limpeza automática pois relatórios não expiram
}
