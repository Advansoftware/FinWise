'use server';

/**
 * SISTEMA DE AUTOMAÇÃO DE IA - ECONOMIA DE CRÉDITOS V2
 * 
 * Este serviço implementa um sistema inteligente que gera automaticamente:
 * - Dicas de gastos mensais
 * - Perfil financeiro 
 * - Relatórios mensais e anuais
 * - Previsões de saldo
 * 
 * REGRAS ATUALIZADAS:
 * 1. Cache renovado automaticamente no dia 1 de cada mês na primeira consulta
 * 2. Validação de dados suficientes antes de chamar IA
 * 3. NÃO CONSOME CRÉDITOS para ações automáticas
 * 4. Consome créditos apenas para atualizações manuais com Gastometria IA
 * 5. Previsão de saldo usa cálculos diretos antes de enviar para IA
 */

import {getDatabaseAdapter} from '@/core/services/service-factory';
import {Transaction, Wallet, Budget} from '@/lib/types';
import {getSpendingTip, getFinancialProfile, generateMonthlyReportAction, generateAnnualReportAction, predictFutureBalanceAction, projectGoalCompletionAction} from './ai-actions';
import {getCachedOrGenerate, validateDataSufficiency, shouldAutoGenerateCache, DataValidationResult} from './ai-cache-service';

/**
 * Gera dica de gastos inteligente com validação de dados
 */
export async function getSmartSpendingTip(transactions: Transaction[], userId: string, forceRefresh: boolean = false): Promise<string> {
  // Valida se há dados suficientes
  const validation = await validateDataSufficiency(userId, 'spending_tip', transactions);
  if (!validation.isValid) {
    return validation.message || "Dados insuficientes para gerar dica.";
  }

  return await getCachedOrGenerate(
    userId,
    'spending_tip',
    async () => {
      return await getSpendingTip(transactions, userId, forceRefresh);
    },
    forceRefresh
  );
}

/**
 * Gera perfil financeiro inteligente com validação de dados
 */
export async function getSmartFinancialProfile(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Busca dados de gamificação para enriquecer o perfil
  let gamificationData = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/installments/gamification?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      gamificationData = data;
    }
  } catch (error) {
    console.log('Não foi possível carregar dados de gamificação para o perfil:', error);
  }

  // Adiciona gamificação ao input se disponível
  const enrichedInput = {
    ...input,
    gamificationData: gamificationData ? JSON.stringify(gamificationData, null, 2) : undefined
  };

  // Parse das transações para validação
  let transactions: Transaction[] = [];
  try {
    transactions = JSON.parse(enrichedInput.currentMonthTransactions || '[]');
  } catch (error) {
    console.log('Erro ao parsear transações para validação:', error);
  }

  // Valida se há dados suficientes
  const validation = await validateDataSufficiency(userId, 'financial_profile', transactions);
  if (!validation.isValid) {
    return {
      summary: validation.message || "Dados insuficientes para gerar perfil.",
      insights: [],
      recommendations: []
    };
  }

  return await getCachedOrGenerate(
    userId,
    'financial_profile',
    async () => {
      return await getFinancialProfile(enrichedInput, userId, forceRefresh);
    },
    forceRefresh
  );
}

/**
 * Gera relatório mensal inteligente com validação de dados
 */
export async function getSmartMonthlyReport(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Parse das transações para validação
  let transactions: Transaction[] = [];
  try {
    transactions = JSON.parse(input.transactions || '[]');
  } catch (error) {
    console.log('Erro ao parsear transações para validação:', error);
  }

  // Valida se há dados suficientes
  const validation = await validateDataSufficiency(userId, 'monthly_report', transactions);
  if (!validation.isValid) {
    return {
      summary: validation.message || "Dados insuficientes para gerar relatório.",
      insights: [],
      recommendations: []
    };
  }

  return await getCachedOrGenerate(
    userId,
    'monthly_report',
    async () => {
      return await generateMonthlyReportAction(input, userId, !forceRefresh);
    },
    forceRefresh
  );
}

/**
 * Gera relatório anual inteligente com validação de dados
 */
export async function getSmartAnnualReport(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Parse das transações para validação
  let transactions: Transaction[] = [];
  try {
    transactions = JSON.parse(input.transactions || '[]');
  } catch (error) {
    console.log('Erro ao parsear transações para validação:', error);
  }

  // Valida se há dados suficientes
  const validation = await validateDataSufficiency(userId, 'annual_report', transactions);
  if (!validation.isValid) {
    return {
      summary: validation.message || "Dados insuficientes para gerar relatório anual.",
      insights: [],
      recommendations: []
    };
  }

  return await getCachedOrGenerate(
    userId,
    'annual_report',
    async () => {
      return await generateAnnualReportAction(input, userId, !forceRefresh);
    },
    forceRefresh
  );
}

/**
 * Calcula previsão de saldo com cálculos diretos antes de enviar para IA
 */
export async function calculateFutureBalancePreview(
  transactions: Transaction[],
  currentBalance: number,
  budgets: Budget[]
): Promise<{
  projectedBalance: number;
  averageDailySpending: number;
  remainingDays: number;
  totalBudgetPending: number;
  isRiskOfNegativeBalance: boolean;
}> {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = lastDayOfMonth - now.getDate();

  // Calcular média de gastos diários dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentExpenses = transactions.filter(t =>
    t.type === 'expense' &&
    new Date(t.date) >= thirtyDaysAgo
  );

  const totalRecentExpenses = recentExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const averageDailySpending = totalRecentExpenses / 30;

  // Calcular total de orçamentos pendentes (contas fixas)
  const totalBudgetPending = budgets.reduce((sum, budget) => sum + budget.amount, 0);

  // Projetar gastos futuros
  const projectedVariableExpenses = averageDailySpending * remainingDays;
  const totalProjectedExpenses = projectedVariableExpenses + totalBudgetPending;

  // Calcular saldo projetado
  const projectedBalance = currentBalance - totalProjectedExpenses;
  const isRiskOfNegativeBalance = projectedBalance < 0 || projectedBalance < (currentBalance * 0.1);

  return {
    projectedBalance,
    averageDailySpending,
    remainingDays,
    totalBudgetPending,
    isRiskOfNegativeBalance
  };
}

/**
 * Gera previsão de saldo inteligente com cálculos diretos + IA
 */
export async function getSmartFutureBalance(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Parse dos dados para validação e cálculos
  let transactions: Transaction[] = [];
  let budgets: Budget[] = [];
  const currentBalance = input.currentBalance || 0;

  try {
    transactions = JSON.parse(input.last3MonthsTransactions || '[]');
    budgets = JSON.parse(input.recurringBills || '[]');
  } catch (error) {
    console.log('Erro ao parsear dados para previsão:', error);
  }

  // Valida se há dados suficientes
  const validation = await validateDataSufficiency(userId, 'future_balance', transactions, { budgets });
  if (!validation.isValid) {
    return {
      summary: validation.message || "Dados insuficientes para previsão.",
      projectedEndOfMonthBalance: currentBalance,
      isRiskOfNegativeBalance: false
    };
  }

  // Calcular dados básicos primeiro
  const calculatedData = await calculateFutureBalancePreview(transactions, currentBalance, budgets);

  // Se há risco alto ou dados simples, usar apenas cálculos diretos
  if (transactions.length < 15 || budgets.length === 0) {
    return {
      summary: `Com base nos seus últimos gastos (R$ ${calculatedData.averageDailySpending.toFixed(2)}/dia), você deve terminar o mês com aproximadamente R$ ${calculatedData.projectedBalance.toFixed(2)}.`,
      projectedEndOfMonthBalance: calculatedData.projectedBalance,
      isRiskOfNegativeBalance: calculatedData.isRiskOfNegativeBalance
    };
  }

  return await getCachedOrGenerate(
    userId,
    'future_balance',
    async () => {
      // Enriquecer input com dados calculados
      const enrichedInput = {
        ...input,
        calculatedData: JSON.stringify(calculatedData, null, 2)
      };

      return await predictFutureBalanceAction(enrichedInput, userId, forceRefresh);
    },
    forceRefresh
  );
}

/**
 * Gera previsão inteligente para meta com validação
 */
export async function getSmartGoalPrediction(
  goalId: string,
  goalData: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const type = `goal_prediction_${goalId}`;

  return await getCachedOrGenerate(
    userId,
    type,
    async () => {
      return await projectGoalCompletionAction(goalData, userId);
    },
    forceRefresh
  );
}

/**
 * Limpa dados antigos (manter apenas últimos 3 meses)
 */
export async function cleanupOldAIData(): Promise<void> {
  const { cleanupOldCache } = await import('./ai-cache-service');
  await cleanupOldCache();
}
