'use server';

/**
 * SISTEMA DE AUTOMAÇÃO DE IA - ECONOMIA DE CRÉDITOS
 * 
 * Este serviço implementa um sistema inteligente que gera automaticamente:
 * - Dicas de gastos mensais
 * - Perfil financeiro 
 * - Relatórios mensais e anuais
 * - Previsões de saldo
 * 
 * REGRAS:
 * 1. Geração automática ocorre 1x por mês (dia 1) para cada usuário
 * 2. Dados são salvos no banco e consultados de lá
 * 3. NÃO CONSOME CRÉDITOS quando é automático
 * 4. Consome créditos apenas quando usuário força refresh
 * 5. Se não existir dados salvos, gera na primeira consulta sem consumir créditos
 */

import { getDatabaseAdapter } from '@/core/services/service-factory';
import { Transaction } from '@/lib/types';
import { getSpendingTip, getFinancialProfile, generateMonthlyReportAction, generateAnnualReportAction, predictFutureBalanceAction, projectGoalCompletionAction } from './ai-actions';

/**
 * Salva dado gerado automaticamente
 */
async function saveGeneratedData(userId: string, type: string, data: any, forceReplace: boolean = false): Promise<void> {
  const db = await getDatabaseAdapter();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const dataToSave = {
    userId,
    type,
    data,
    generatedAt: now,
    month: currentMonth,
    year: currentYear
  };

  if (forceReplace) {
    await db.aiGeneratedData.replaceByUserIdAndType(userId, type, dataToSave);
  } else {
    await db.aiGeneratedData.create(dataToSave);
  }
}

/**
 * Busca dado gerado mais recente
 */
async function getLatestGeneratedData(userId: string, type: string): Promise<any | null> {
  const db = await getDatabaseAdapter();
  return await db.aiGeneratedData.findLatestByUserIdAndType(userId, type);
}

/**
 * Gera dica de gastos inteligente (sem consumir créditos quando automático)
 */
export async function getSmartSpendingTip(transactions: Transaction[], userId: string, forceRefresh: boolean = false): Promise<string> {
  // Se forçar refresh, usa a função normal que consome créditos
  if (forceRefresh) {
    const tip = await getSpendingTip(transactions, userId, true);

    // Substitui dados antigos
    await saveGeneratedData(userId, 'spending_tip', tip, true);
    return tip;
  }

  // Verifica se já tem dica gerada este mês
  const cachedTip = await getLatestGeneratedData(userId, 'spending_tip');
  if (cachedTip) {
    return cachedTip;
  }

  // Se não tem, gera primeira vez sem consumir créditos
  const tip = await getSpendingTip(transactions, userId, false);
  await saveGeneratedData(userId, 'spending_tip', tip);
  return tip;
}

/**
 * Gera perfil financeiro inteligente (sem consumir créditos quando automático)
 */
export async function getSmartFinancialProfile(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Se forçar refresh, usa a função normal que consome créditos
  if (forceRefresh) {
    const profile = await getFinancialProfile(input, userId, true);

    // Substitui dados antigos
    await saveGeneratedData(userId, 'financial_profile', profile, true);
    return profile;
  }

  // Verifica se já tem perfil gerado este mês
  const cachedProfile = await getLatestGeneratedData(userId, 'financial_profile');
  if (cachedProfile) {
    return cachedProfile;
  }

  // Se não tem, gera primeira vez sem consumir créditos
  const profile = await getFinancialProfile(input, userId, false);
  await saveGeneratedData(userId, 'financial_profile', profile);
  return profile;
}

/**
 * Gera relatório mensal inteligente (sem consumir créditos quando automático)
 */
export async function getSmartMonthlyReport(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Se forçar refresh, usa a função normal que consome créditos
  if (forceRefresh) {
    const report = await generateMonthlyReportAction(input, userId, false);

    // Substitui dados antigos
    await saveGeneratedData(userId, 'monthly_report', report, true);
    return report;
  }

  // Verifica se já tem relatório gerado este mês
  const cachedReport = await getLatestGeneratedData(userId, 'monthly_report');
  if (cachedReport) {
    return cachedReport;
  }

  // Se não tem, gera primeira vez sem consumir créditos (isFreeAction = true)
  const report = await generateMonthlyReportAction(input, userId, true);
  await saveGeneratedData(userId, 'monthly_report', report);
  return report;
}

/**
 * Gera relatório anual inteligente (sem consumir créditos quando automático)
 */
export async function getSmartAnnualReport(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Se forçar refresh, usa a função normal que consome créditos
  if (forceRefresh) {
    const report = await generateAnnualReportAction(input, userId, false);

    // Substitui dados antigos
    await saveGeneratedData(userId, 'annual_report', report, true);
    return report;
  }

  // Verifica se já tem relatório gerado este ano
  const cachedReport = await getLatestGeneratedData(userId, 'annual_report');
  if (cachedReport) {
    return cachedReport;
  }

  // Se não tem, gera primeira vez sem consumir créditos (isFreeAction = true)
  const report = await generateAnnualReportAction(input, userId, true);
  await saveGeneratedData(userId, 'annual_report', report);
  return report;
}

/**
 * Gera previsão de saldo inteligente (sem consumir créditos quando automático)
 */
export async function getSmartFutureBalance(
  input: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  // Se forçar refresh, usa a função normal que consome créditos
  if (forceRefresh) {
    const prediction = await predictFutureBalanceAction(input, userId, true);

    // Substitui dados antigos
    await saveGeneratedData(userId, 'future_balance', prediction, true);
    return prediction;
  }

  // Verifica se já tem previsão gerada este mês
  const cachedPrediction = await getLatestGeneratedData(userId, 'future_balance');
  if (cachedPrediction) {
    return cachedPrediction;
  }

  // Se não tem, gera primeira vez sem consumir créditos
  const prediction = await predictFutureBalanceAction(input, userId, false);
  await saveGeneratedData(userId, 'future_balance', prediction);
  return prediction;
}

/**
 * Gera previsão inteligente para meta (1x por dia quando há depósito)
 */
export async function getSmartGoalPrediction(
  goalId: string,
  goalData: any,
  userId: string,
  forceRefresh: boolean = false
): Promise<any> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const type = `goal_prediction_${goalId}`;

  // Se forçar refresh, usa a função normal que consome créditos
  if (forceRefresh) {
    const prediction = await projectGoalCompletionAction(goalData, userId);

    // Salva nova previsão
    await saveGeneratedDataWithRelatedId(userId, type, prediction, goalId, true);
    return prediction;
  }

  // Verifica se já foi gerada hoje
  const db = await getDatabaseAdapter();
  const todayPrediction = await db.aiGeneratedData.findByUserIdTypeAndDate(userId, type, today);
  if (todayPrediction) {
    return todayPrediction;
  }

  // Se não tem, gera primeira vez sem consumir créditos
  const prediction = await projectGoalCompletionAction(goalData, userId);
  await saveGeneratedDataWithRelatedId(userId, type, prediction, goalId);
  return prediction;
}

/**
 * Salva dado gerado com relatedId (para metas específicas)
 */
async function saveGeneratedDataWithRelatedId(
  userId: string,
  type: string,
  data: any,
  relatedId: string,
  forceReplace: boolean = false
): Promise<void> {
  const db = await getDatabaseAdapter();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const dataToSave = {
    userId,
    type,
    data,
    generatedAt: now,
    month: currentMonth,
    year: currentYear,
    relatedId
  };

  if (forceReplace) {
    await db.aiGeneratedData.replaceByUserIdAndType(userId, type, dataToSave);
  } else {
    await db.aiGeneratedData.create(dataToSave);
  }
}/**
 * Limpa dados antigos (manter apenas últimos 6 meses)
 */
export async function cleanupOldAIData(): Promise<void> {
  const db = await getDatabaseAdapter();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  await db.aiGeneratedData.deleteOldData(sixMonthsAgo);

  console.log('[AI Automation] Cleaned up old AI data');
}
