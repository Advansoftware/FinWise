// src/services/ai-service-router.ts
'use client';

/**
 * Router de IA - Roteia para as server actions de IA.
 * 
 * Este módulo centraliza todas as chamadas de IA, facilitando 
 * a manutenção e possíveis futuras expansões.
 */

import { Transaction, Budget, Goal, AICredential } from '@/lib/types';
import { Message } from '@/ai/ai-types';

// Cache das configurações de IA do usuário
let cachedCredential: AICredential | null = null;
let cachedUserId: string | null = null;

/**
 * Atualiza o cache da credencial ativa
 */
export function setActiveCredential(credential: AICredential | null, userId: string) {
  cachedCredential = credential;
  cachedUserId = userId;
}

/**
 * Retorna informações do status atual
 */
export function getAIStatus(): {
  provider: string | null;
  isReady: boolean;
  modelId: string | null;
} {
  return {
    provider: cachedCredential?.provider || null,
    isReady: true,
    modelId: null,
  };
}

// ==================== FUNÇÕES DE IA ROTEADAS ====================

/**
 * Chat com assistente
 */
export async function chat(
  history: Message[],
  prompt: string,
  transactions: Transaction[],
  userId: string,
  monthlyReports?: any[],
  annualReports?: any[]
): Promise<string> {
  const { getChatbotResponse } = await import('./ai-actions');
  return getChatbotResponse(
    {
      history,
      prompt,
      transactions,
      monthlyReports: monthlyReports || [],
      annualReports: annualReports || [],
    },
    userId
  );
}

/**
 * Dica de economia
 */
export async function getSpendingTip(
  transactions: Transaction[],
  userId: string,
  forceRefresh: boolean = false
): Promise<string> {
  const { getSpendingTip: serverGetSpendingTip } = await import('./ai-actions');
  return serverGetSpendingTip(transactions, userId, forceRefresh);
}

/**
 * Análise de transações
 */
export async function analyzeTransactions(
  transactions: Transaction[],
  userId: string,
  isFreeAction: boolean = false
): Promise<string> {
  const { analyzeTransactionsAction } = await import('./ai-actions');
  return analyzeTransactionsAction(transactions, userId, isFreeAction);
}

/**
 * Sugestão de categoria
 */
export async function suggestCategory(
  input: { itemName: string; existingCategories: string[] },
  userId: string,
  isFreeAction: boolean = false
): Promise<{ category: string; subcategory?: string }> {
  const { suggestCategoryForItemAction } = await import('./ai-actions');
  return suggestCategoryForItemAction(input, userId, isFreeAction);
}

/**
 * Sugestão de orçamento
 */
export async function suggestBudget(
  input: { category: string; transactions: string },
  userId: string,
  isFreeAction: boolean = false
): Promise<{ suggestedAmount: number; justification: string }> {
  const { suggestBudgetAmountAction } = await import('./ai-actions');
  return suggestBudgetAmountAction(input, userId, isFreeAction);
}

/**
 * Relatório mensal
 */
export async function generateMonthlyReport(
  transactions: Transaction[],
  month: number,
  year: number,
  userId: string,
  isFreeAction: boolean = false
): Promise<{ summary: string }> {
  const { generateMonthlyReportAction } = await import('./ai-actions');
  const result = await generateMonthlyReportAction(
    {
      transactions: JSON.stringify(transactions.map(t => ({
        item: t.item,
        category: t.category,
        amount: t.amount,
        date: t.date,
        type: t.type,
      }))),
      month: String(month).padStart(2, '0'),
      year: String(year),
    },
    userId,
    isFreeAction
  );

  return { summary: result.summary };
}

/**
 * Perfil financeiro
 */
export async function getFinancialProfile(
  transactions: Transaction[],
  monthlyReports: any[],
  annualReports: any[],
  userId: string,
  forceRefresh: boolean = false,
  gamificationData?: any
): Promise<{ profileName: string; profileDescription: string }> {
  const { getFinancialProfile: serverGetFinancialProfile } = await import('./ai-actions');
  return serverGetFinancialProfile(
    {
      currentMonthTransactions: JSON.stringify(transactions.map(t => ({
        item: t.item,
        category: t.category,
        amount: t.amount,
        date: t.date,
        type: t.type,
      }))),
      monthlyReports: JSON.stringify(monthlyReports),
      annualReports: JSON.stringify(annualReports),
      gamificationData: gamificationData ? JSON.stringify(gamificationData) : undefined,
    },
    userId,
    forceRefresh
  );
}

/**
 * Projeção de meta
 */
export async function projectGoalCompletion(
  input: {
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    monthlyDeposit: number;
    targetDate?: string;
    transactions: string;
  },
  userId: string,
  isFreeAction: boolean = false
): Promise<{ projection: string; completionDate?: string; requiredMonthlyDeposit?: number }> {
  const { projectGoalCompletionAction } = await import('./ai-actions');
  return projectGoalCompletionAction(input, userId, isFreeAction);
}

/**
 * Orçamentos automáticos
 */
export async function generateAutomaticBudgets(
  input: { lastMonthTransactions: string; existingBudgets: string },
  userId: string,
  isFreeAction: boolean = false
): Promise<{ suggestedBudgets: { category: string; name: string; amount: number }[] }> {
  const { generateAutomaticBudgetsAction } = await import('./ai-actions');
  return generateAutomaticBudgetsAction(input, userId, isFreeAction);
}

/**
 * Previsão de saldo futuro
 */
export async function predictFutureBalance(
  currentBalance: number,
  transactions: Transaction[],
  recurringBills: any[],
  userId: string,
  forceRefresh: boolean = false
): Promise<{ projectedEndOfMonthBalance: number; isRiskOfNegativeBalance: boolean; summary: string }> {
  const { predictFutureBalanceAction } = await import('./ai-actions');
  return predictFutureBalanceAction(
    {
      last3MonthsTransactions: JSON.stringify(transactions.map(t => ({
        item: t.item,
        category: t.category,
        amount: t.amount,
        date: t.date,
        type: t.type,
      }))),
      currentBalance,
      recurringBills: JSON.stringify(recurringBills),
    },
    userId,
    forceRefresh
  );
}

export default {
  setActiveCredential,
  getAIStatus,
  chat,
  getSpendingTip,
  analyzeTransactions,
  suggestCategory,
  suggestBudget,
  generateMonthlyReport,
  getFinancialProfile,
  projectGoalCompletion,
  generateAutomaticBudgets,
  predictFutureBalance,
};
