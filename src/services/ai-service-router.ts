// src/services/ai-service-router.ts
'use client';

/**
 * Router de IA - Detecta o provider ativo e roteia para a implementação correta.
 * 
 * Se o usuário usa WebLLM: executa client-side (sem consumir créditos)
 * Caso contrário: usa server actions (pode consumir créditos se for Gastometria AI)
 * 
 * IMPORTANTE: WebLLM só está disponível para usuários com plano que permite
 * adicionar credenciais próprias (Plus ou superior).
 */

import { Transaction, Budget, Goal, AICredential } from '@/lib/types';
import { Message } from '@/ai/ai-types';
import * as webllmService from './webllm-service';
import * as webllmActions from './webllm-ai-actions';

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
 * Verifica se WebLLM está ativo e pronto
 */
export function isWebLLMActive(): boolean {
  return cachedCredential?.provider === 'webllm' && webllmService.isModelLoaded();
}

/**
 * Verifica se o provider atual é WebLLM (mesmo que não esteja carregado ainda)
 */
export function isWebLLMProvider(): boolean {
  return cachedCredential?.provider === 'webllm';
}

/**
 * Retorna informações do status atual
 */
export function getAIStatus(): {
  provider: string | null;
  isWebLLM: boolean;
  isReady: boolean;
  modelId: string | null;
} {
  return {
    provider: cachedCredential?.provider || null,
    isWebLLM: cachedCredential?.provider === 'webllm',
    isReady: cachedCredential?.provider === 'webllm'
      ? webllmService.isModelLoaded()
      : true,
    modelId: webllmService.getCurrentModelId(),
  };
}

// ==================== FUNÇÕES DE IA ROTEADAS ====================

/**
 * Chat com assistente - roteia para WebLLM ou server action
 */
export async function chat(
  history: Message[],
  prompt: string,
  transactions: Transaction[],
  userId: string,
  monthlyReports?: any[],
  annualReports?: any[]
): Promise<string> {
  if (isWebLLMActive()) {
    return webllmActions.chatWithWebLLM(
      history,
      prompt,
      transactions,
      monthlyReports,
      annualReports
    );
  }

  // Fallback para server action
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
 * Dica de economia - roteia para WebLLM ou server action
 */
export async function getSpendingTip(
  transactions: Transaction[],
  userId: string,
  forceRefresh: boolean = false
): Promise<string> {
  if (isWebLLMActive()) {
    return webllmActions.getSpendingTipWithWebLLM(transactions);
  }

  const { getSpendingTip: serverGetSpendingTip } = await import('./ai-actions');
  return serverGetSpendingTip(transactions, userId, forceRefresh);
}

/**
 * Análise de transações - roteia para WebLLM ou server action
 */
export async function analyzeTransactions(
  transactions: Transaction[],
  userId: string,
  isFreeAction: boolean = false
): Promise<string> {
  if (isWebLLMActive()) {
    return webllmActions.analyzeTransactionsWithWebLLM(transactions);
  }

  const { analyzeTransactionsAction } = await import('./ai-actions');
  return analyzeTransactionsAction(transactions, userId, isFreeAction);
}

/**
 * Sugestão de categoria - roteia para WebLLM ou server action
 * Mantém compatibilidade com a interface original da server action
 */
export async function suggestCategory(
  input: { itemName: string; existingCategories: string[] },
  userId: string,
  isFreeAction: boolean = false
): Promise<{ category: string; subcategory?: string }> {
  if (isWebLLMActive()) {
    const category = await webllmActions.suggestCategoryWithWebLLM(
      input.itemName,
      input.existingCategories
    );
    return { category };
  }

  const { suggestCategoryForItemAction } = await import('./ai-actions');
  return suggestCategoryForItemAction(input, userId, isFreeAction);
}

/**
 * Sugestão de orçamento - roteia para WebLLM ou server action
 * Mantém compatibilidade com a interface original da server action
 */
export async function suggestBudget(
  input: { category: string; transactions: string },
  userId: string,
  isFreeAction: boolean = false
): Promise<{ suggestedAmount: number; justification: string }> {
  if (isWebLLMActive()) {
    // Parse transactions string de volta para array
    const transactionsArray = JSON.parse(input.transactions) as Transaction[];
    const amount = await webllmActions.suggestBudgetWithWebLLM(input.category, transactionsArray);
    return { suggestedAmount: amount, justification: 'Sugestão baseada em análise local com IA.' };
  }

  const { suggestBudgetAmountAction } = await import('./ai-actions');
  return suggestBudgetAmountAction(input, userId, isFreeAction);
}

/**
 * Relatório mensal - roteia para WebLLM ou server action
 * Retorna formato simplificado para uso em componentes
 */
export async function generateMonthlyReport(
  transactions: Transaction[],
  month: number,
  year: number,
  userId: string,
  isFreeAction: boolean = false
): Promise<{ summary: string }> {
  if (isWebLLMActive()) {
    const result = await webllmActions.generateMonthlyReportWithWebLLM(transactions, month, year);
    return { summary: result.summary };
  }

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
 * Perfil financeiro - roteia para WebLLM ou server action
 */
export async function getFinancialProfile(
  transactions: Transaction[],
  monthlyReports: any[],
  annualReports: any[],
  userId: string,
  forceRefresh: boolean = false,
  gamificationData?: any
): Promise<{ profileName: string; profileDescription: string }> {
  if (isWebLLMActive()) {
    return webllmActions.getFinancialProfileWithWebLLM(transactions, monthlyReports, annualReports);
  }

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
 * Projeção de meta - roteia para WebLLM ou server action
 * Mantém compatibilidade com a interface original da server action
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
  if (isWebLLMActive()) {
    const transactionsArray = JSON.parse(input.transactions) as Transaction[];
    const goal: Goal = {
      id: '',
      userId: userId,
      name: input.goalName,
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount,
      monthlyDeposit: input.monthlyDeposit,
      targetDate: input.targetDate,
      createdAt: new Date().toISOString(),
    };
    return webllmActions.projectGoalCompletionWithWebLLM(goal, transactionsArray);
  }

  const { projectGoalCompletionAction } = await import('./ai-actions');
  return projectGoalCompletionAction(input, userId, isFreeAction);
}

/**
 * Orçamentos automáticos - roteia para WebLLM ou server action
 * Mantém compatibilidade com a interface original da server action
 */
export async function generateAutomaticBudgets(
  input: { lastMonthTransactions: string; existingBudgets: string },
  userId: string,
  isFreeAction: boolean = false
): Promise<{ suggestedBudgets: { category: string; name: string; amount: number }[] }> {
  if (isWebLLMActive()) {
    const transactions = JSON.parse(input.lastMonthTransactions) as Transaction[];
    const existingBudgets = JSON.parse(input.existingBudgets) as string[];
    return webllmActions.generateAutomaticBudgetsWithWebLLM(
      transactions,
      existingBudgets.map(cat => ({ category: cat, amount: 0 }))
    );
  }

  const { generateAutomaticBudgetsAction } = await import('./ai-actions');
  return generateAutomaticBudgetsAction(input, userId, isFreeAction);
}

/**
 * Previsão de saldo futuro - roteia para WebLLM ou server action
 */
export async function predictFutureBalance(
  currentBalance: number,
  transactions: Transaction[],
  recurringBills: any[],
  userId: string,
  forceRefresh: boolean = false
): Promise<{ projectedEndOfMonthBalance: number; isRiskOfNegativeBalance: boolean; summary: string }> {
  if (isWebLLMActive()) {
    return webllmActions.predictFutureBalanceWithWebLLM(currentBalance, transactions, 1);
  }

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
  isWebLLMActive,
  isWebLLMProvider,
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
