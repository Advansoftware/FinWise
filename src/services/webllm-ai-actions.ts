// src/services/webllm-ai-actions.ts
'use client';

/**
 * Ações de IA client-side usando WebLLM.
 * 
 * Essas funções espelham as ações do ai-actions.ts mas executam
 * diretamente no navegador usando o WebLLM, sem necessidade de servidor.
 * 
 * Como os dados estão no IndexedDB, o WebLLM pode acessá-los diretamente.
 */

import { Transaction } from '@/lib/types';
import { Message } from '@/ai/ai-types';
import { offlineStorage } from '@/lib/offline-storage';
import * as webllmService from './webllm-service';

// System prompts para diferentes contextos
const SYSTEM_PROMPTS = {
  chat: `Você é o Assistente Financeiro Gastometria, um assistente amigável e prestativo especializado em finanças pessoais.

INSTRUÇÕES IMPORTANTES:
1. Responda SEMPRE em Português do Brasil, de forma clara, amigável e natural.
2. Se o usuário cumprimentar você (oi, olá, bom dia, etc.), responda de forma calorosa e pergunte como pode ajudar.
3. Use os dados financeiros fornecidos para dar respostas personalizadas quando relevante.
4. Forneça dicas práticas e acionáveis sobre finanças.
5. Seja conversacional - você é um assistente, não um robô.
6. Se não houver dados financeiros, ainda assim seja útil e conversacional.
7. Você pode ajudar com: análise de gastos, dicas de economia, planejamento financeiro, orçamentos, metas, etc.

Lembre-se: mesmo que não haja muitas transações, você ainda pode conversar e ajudar o usuário!`,

  tip: `Você é um consultor financeiro especializado em dicas práticas.
Analise as transações fornecidas e forneça UMA dica de economia específica e acionável.
Responda sempre em Português do Brasil.
A dica deve ser curta (2-3 frases) e baseada nos padrões reais de gastos do usuário.`,

  analysis: `Você é um analista financeiro detalhista.
Analise as transações fornecidas e forneça insights sobre:
- Padrões de gastos
- Categorias com maior volume
- Oportunidades de economia
- Anomalias ou gastos incomuns
Responda sempre em Português do Brasil, em formato markdown.`,

  report: `Você é um especialista em relatórios financeiros.
Crie um resumo mensal detalhado incluindo:
- Total de receitas e despesas
- Principais categorias de gastos
- Comparação com meses anteriores (se disponível)
- Recomendações para o próximo mês
Responda sempre em Português do Brasil, em formato markdown.`,

  category: `Você é um classificador de transações financeiras.
Dado o nome/descrição de uma transação, sugira a categoria mais apropriada.
Responda APENAS com o nome da categoria, nada mais.
Categorias comuns: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Serviços, Outros.`,

  budget: `Você é um consultor de orçamentos pessoais.
Com base nos gastos históricos, sugira um valor de orçamento adequado para a categoria.
Responda APENAS com o valor numérico sugerido (sem R$, apenas o número).`,
};

/**
 * Formata transações para incluir no prompt
 */
function formatTransactionsForPrompt(transactions: Transaction[]): string {
  if (!transactions || transactions.length === 0) {
    return `
DADOS FINANCEIROS DO USUÁRIO:
Não há transações registradas no período atual.
O usuário pode estar começando a usar o app ou não registrou gastos ainda.
`;
  }

  const summary = transactions.slice(0, 50).map(t =>
    `- ${t.item}: R$ ${Math.abs(t.amount).toFixed(2)} (${t.type === 'expense' ? 'Despesa' : 'Receita'}) - ${t.category} - ${new Date(t.date).toLocaleDateString('pt-BR')}`
  ).join('\n');

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Agrupar por categoria
  const byCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
  });

  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amount]) => `  - ${cat}: R$ ${amount.toFixed(2)}`)
    .join('\n');

  return `
DADOS FINANCEIROS DO USUÁRIO (Mês Atual):
- Total de Receitas: R$ ${totalIncome.toFixed(2)}
- Total de Despesas: R$ ${totalExpenses.toFixed(2)}
- Saldo do Mês: R$ ${(totalIncome - totalExpenses).toFixed(2)}
- Número de Transações: ${transactions.length}

Principais Categorias de Gastos:
${categoryBreakdown || '  Nenhum gasto registrado'}

Últimas Transações:
${summary}
`;
}

/**
 * Formata relatórios mensais para contexto
 */
function formatReportsForPrompt(monthlyReports?: any[], annualReports?: any[]): string {
  let context = '';

  if (monthlyReports && monthlyReports.length > 0) {
    context += '\nRELATÓRIOS MENSAIS ANTERIORES:\n';
    monthlyReports.slice(0, 6).forEach(r => {
      context += `- ${r.period || r.monthName}: Receitas R$ ${r.totalIncome?.toFixed(2) || '0.00'}, Despesas R$ ${r.totalExpense?.toFixed(2) || '0.00'}\n`;
    });
  }

  if (annualReports && annualReports.length > 0) {
    context += '\nRELATÓRIOS ANUAIS:\n';
    annualReports.slice(0, 3).forEach(r => {
      context += `- Ano ${r.period || r.year}: Total Receitas R$ ${r.totalIncome?.toFixed(2) || '0.00'}, Total Despesas R$ ${r.totalExpense?.toFixed(2) || '0.00'}\n`;
    });
  }

  return context;
}

/**
 * Chat com o assistente usando WebLLM
 */
export async function chatWithWebLLM(
  history: Message[],
  prompt: string,
  transactions: Transaction[],
  monthlyReports?: any[],
  annualReports?: any[]
): Promise<string> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado. Aguarde o carregamento ou verifique as configurações.');
  }

  // Constrói contexto com dados financeiros
  const financialContext = formatTransactionsForPrompt(transactions);
  const reportsContext = formatReportsForPrompt(monthlyReports, annualReports);

  // Inclui histórico de conversa
  let conversationContext = '';
  if (history.length > 0) {
    conversationContext = '\n\nHISTÓRICO DA CONVERSA:\n' +
      history.slice(-6).map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');
  }

  // Monta o prompt completo
  const fullPrompt = `${financialContext}${reportsContext}${conversationContext}

MENSAGEM DO USUÁRIO: ${prompt}

Responda de forma natural e amigável:`;

  const response = await webllmService.generateText(fullPrompt, SYSTEM_PROMPTS.chat);
  return response;
}

/**
 * Gera uma dica de economia usando WebLLM
 */
export async function getSpendingTipWithWebLLM(transactions: Transaction[]): Promise<string> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  const financialContext = formatTransactionsForPrompt(transactions);
  const prompt = `${financialContext}\n\nCom base nessas transações, dê uma dica prática e específica para economizar dinheiro.`;

  const response = await webllmService.generateText(prompt, SYSTEM_PROMPTS.tip);
  return response;
}

/**
 * Analisa transações usando WebLLM
 */
export async function analyzeTransactionsWithWebLLM(transactions: Transaction[]): Promise<string> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  const financialContext = formatTransactionsForPrompt(transactions);
  const prompt = `${financialContext}\n\nFaça uma análise detalhada dessas transações.`;

  const response = await webllmService.generateText(prompt, SYSTEM_PROMPTS.analysis);
  return response;
}

/**
 * Sugere categoria para uma transação
 */
export async function suggestCategoryWithWebLLM(
  description: string,
  availableCategories: string[]
): Promise<string> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  const prompt = `Transação: "${description}"
Categorias disponíveis: ${availableCategories.join(', ')}

Qual a categoria mais apropriada para esta transação?`;

  const response = await webllmService.generateText(prompt, SYSTEM_PROMPTS.category);

  // Tenta encontrar a categoria na resposta
  const lowerResponse = response.toLowerCase().trim();
  const matchedCategory = availableCategories.find(cat =>
    lowerResponse.includes(cat.toLowerCase())
  );

  return matchedCategory || availableCategories[0] || 'Outros';
}

/**
 * Sugere valor de orçamento para uma categoria
 */
export async function suggestBudgetWithWebLLM(
  category: string,
  transactions: Transaction[]
): Promise<number> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  // Filtra transações da categoria
  const categoryTransactions = transactions.filter(t =>
    t.category?.toLowerCase() === category.toLowerCase() && t.type === 'expense'
  );

  const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const avgSpent = categoryTransactions.length > 0 ? totalSpent / categoryTransactions.length : 0;

  const prompt = `Categoria: ${category}
Total gasto nos últimos meses: R$ ${totalSpent.toFixed(2)}
Média por transação: R$ ${avgSpent.toFixed(2)}
Número de transações: ${categoryTransactions.length}

Sugira um valor de orçamento mensal apropriado para esta categoria.
Responda APENAS com o número (sem R$ ou texto adicional).`;

  const response = await webllmService.generateText(prompt, SYSTEM_PROMPTS.budget);

  // Extrai número da resposta
  const match = response.match(/[\d.,]+/);
  if (match) {
    return parseFloat(match[0].replace(',', '.'));
  }

  // Fallback: média + 20%
  return Math.round(avgSpent * 1.2);
}

/**
 * Gera relatório mensal usando WebLLM
 */
export async function generateMonthlyReportWithWebLLM(
  transactions: Transaction[],
  month: number,
  year: number
): Promise<{ summary: string; highlights: string[]; recommendations: string[] }> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  // Filtra transações do mês
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });

  const financialContext = formatTransactionsForPrompt(monthTransactions);

  const prompt = `${financialContext}

Crie um relatório financeiro para ${month}/${year} com:
1. Um resumo geral (2-3 parágrafos)
2. 3 destaques principais (pontos positivos ou de atenção)
3. 3 recomendações para o próximo mês

Formato da resposta (use exatamente este formato):
RESUMO:
[seu resumo aqui]

DESTAQUES:
- [destaque 1]
- [destaque 2]
- [destaque 3]

RECOMENDAÇÕES:
- [recomendação 1]
- [recomendação 2]
- [recomendação 3]`;

  const response = await webllmService.generateText(prompt, SYSTEM_PROMPTS.report);

  // Parse da resposta
  const summaryMatch = response.match(/RESUMO:\s*([\s\S]*?)(?=DESTAQUES:|$)/i);
  const highlightsMatch = response.match(/DESTAQUES:\s*([\s\S]*?)(?=RECOMENDAÇÕES:|$)/i);
  const recommendationsMatch = response.match(/RECOMENDAÇÕES:\s*([\s\S]*?)$/i);

  const extractListItems = (text: string | undefined): string[] => {
    if (!text) return [];
    return text
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  return {
    summary: summaryMatch?.[1]?.trim() || response,
    highlights: extractListItems(highlightsMatch?.[1]) || [],
    recommendations: extractListItems(recommendationsMatch?.[1]) || [],
  };
}

/**
 * Gera perfil financeiro usando WebLLM
 */
export async function getFinancialProfileWithWebLLM(
  transactions: Transaction[],
  monthlyReports?: any[],
  annualReports?: any[]
): Promise<{ profileName: string; profileDescription: string }> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  const financialContext = formatTransactionsForPrompt(transactions);

  const reportsContext = monthlyReports?.length
    ? `\n\nRelatórios mensais anteriores:\n${monthlyReports.map(r => JSON.stringify(r)).join('\n')}`
    : '';

  const prompt = `${financialContext}${reportsContext}

Com base nos dados financeiros acima, crie um perfil financeiro para o usuário.

Responda EXATAMENTE neste formato:
PERFIL: [nome criativo do perfil em português, ex: "O Estrategista Cauteloso"]
DESCRIÇÃO: [descrição de 2-3 frases explicando o perfil baseado nos padrões de gastos]`;

  const response = await webllmService.generateText(prompt, `Você é um analista de perfis financeiros. Crie perfis criativos e personalizados baseados nos dados. Responda sempre em Português do Brasil.`);

  const profileMatch = response.match(/PERFIL:\s*(.+?)(?=\n|DESCRIÇÃO:|$)/i);
  const descriptionMatch = response.match(/DESCRIÇÃO:\s*([\s\S]+?)$/i);

  return {
    profileName: profileMatch?.[1]?.trim() || 'Explorador Financeiro',
    profileDescription: descriptionMatch?.[1]?.trim() || response,
  };
}

/**
 * Projeta conclusão de meta usando WebLLM
 */
export async function projectGoalCompletionWithWebLLM(
  goal: { name: string; targetAmount: number; currentAmount: number; targetDate?: string; monthlyDeposit?: number },
  transactions: Transaction[]
): Promise<{ projection: string; completionDate?: string; requiredMonthlyDeposit?: number }> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  const remaining = goal.targetAmount - goal.currentAmount;
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const availableMonthly = monthlyIncome - monthlyExpenses;

  const prompt = `Meta: ${goal.name}
Valor alvo: R$ ${goal.targetAmount.toFixed(2)}
Valor atual: R$ ${goal.currentAmount.toFixed(2)}
Falta: R$ ${remaining.toFixed(2)}
${goal.targetDate ? `Data limite: ${goal.targetDate}` : ''}
${goal.monthlyDeposit ? `Depósito mensal planejado: R$ ${goal.monthlyDeposit.toFixed(2)}` : ''}

Renda mensal estimada: R$ ${monthlyIncome.toFixed(2)}
Despesas mensais estimadas: R$ ${monthlyExpenses.toFixed(2)}
Disponível por mês: R$ ${availableMonthly.toFixed(2)}

Faça uma projeção de quando essa meta será alcançada.
Responda de forma concisa em português.`;

  const response = await webllmService.generateText(prompt, `Você é um consultor de metas financeiras. Analise os dados e faça projeções realistas. Responda sempre em Português do Brasil de forma concisa.`);

  // Calcula estimativa simples
  let completionDate: string | undefined;
  let requiredMonthlyDeposit: number | undefined;

  if (goal.monthlyDeposit && goal.monthlyDeposit > 0) {
    const monthsNeeded = Math.ceil(remaining / goal.monthlyDeposit);
    const estimatedDate = new Date();
    estimatedDate.setMonth(estimatedDate.getMonth() + monthsNeeded);
    completionDate = estimatedDate.toISOString().split('T')[0];
  }

  if (goal.targetDate) {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const monthsUntilTarget = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    requiredMonthlyDeposit = Math.ceil(remaining / monthsUntilTarget);
  }

  return {
    projection: response,
    completionDate,
    requiredMonthlyDeposit,
  };
}

/**
 * Gera orçamentos automáticos usando WebLLM
 */
export async function generateAutomaticBudgetsWithWebLLM(
  transactions: Transaction[],
  existingBudgets: { category: string; amount: number }[]
): Promise<{ suggestedBudgets: { category: string; name: string; amount: number }[] }> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  // Agrupa gastos por categoria
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });

  const existingCategories = existingBudgets.map(b => b.category.toLowerCase());
  const newCategories = Object.entries(categoryTotals)
    .filter(([cat]) => !existingCategories.includes(cat.toLowerCase()))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (newCategories.length === 0) {
    return { suggestedBudgets: [] };
  }

  const suggestedBudgets = newCategories.map(([category, total]) => ({
    category,
    name: `Orçamento de ${category}`,
    amount: Math.ceil(total * 1.1 / 10) * 10, // Arredonda para cima e para múltiplo de 10
  }));

  return { suggestedBudgets };
}

/**
 * Prevê saldo futuro usando WebLLM
 */
export async function predictFutureBalanceWithWebLLM(
  currentBalance: number,
  transactions: Transaction[],
  monthsAhead: number = 1
): Promise<{ projectedEndOfMonthBalance: number; isRiskOfNegativeBalance: boolean; summary: string }> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  // Calcula médias mensais
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const projectedBalance = currentBalance + (monthlyIncome - monthlyExpenses) * monthsAhead;
  const isRisk = projectedBalance < 0;

  const prompt = `Saldo atual: R$ ${currentBalance.toFixed(2)}
Receita mensal estimada: R$ ${monthlyIncome.toFixed(2)}
Despesas mensais estimadas: R$ ${monthlyExpenses.toFixed(2)}
Projeção para ${monthsAhead} mês(es): R$ ${projectedBalance.toFixed(2)}

Forneça um resumo de UMA frase sobre a situação financeira projetada.`;

  const response = await webllmService.generateText(prompt, `Você é um consultor financeiro. Analise a projeção e dê um resumo breve. Responda sempre em Português do Brasil.`);

  return {
    projectedEndOfMonthBalance: projectedBalance,
    isRiskOfNegativeBalance: isRisk,
    summary: response.slice(0, 200), // Limita tamanho
  };
}

/**
 * Stream de chat para resposta em tempo real
 */
export async function* chatWithWebLLMStream(
  history: Message[],
  prompt: string,
  transactions: Transaction[]
): AsyncGenerator<string, void, unknown> {
  if (!webllmService.isModelLoaded()) {
    throw new Error('Modelo WebLLM não está carregado.');
  }

  const financialContext = formatTransactionsForPrompt(transactions);

  let conversationContext = '';
  if (history.length > 0) {
    conversationContext = '\n\nHistórico da conversa:\n' +
      history.slice(-6).map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');
  }

  const fullPrompt = `${financialContext}${conversationContext}\n\nPergunta do usuário: ${prompt}`;

  yield* webllmService.generateTextStream(fullPrompt, SYSTEM_PROMPTS.chat);
}

/**
 * Carrega transações do IndexedDB para usar com WebLLM
 */
export async function getTransactionsFromOfflineStorage(userId: string): Promise<Transaction[]> {
  return await offlineStorage.getTransactions(userId);
}

/**
 * Carrega todas as transações disponíveis (online ou offline)
 */
export async function getAllAvailableTransactions(userId: string): Promise<Transaction[]> {
  try {
    return await getTransactionsFromOfflineStorage(userId);
  } catch {
    return [];
  }
}

export default {
  chatWithWebLLM,
  chatWithWebLLMStream,
  getSpendingTipWithWebLLM,
  analyzeTransactionsWithWebLLM,
  suggestCategoryWithWebLLM,
  suggestBudgetWithWebLLM,
  generateMonthlyReportWithWebLLM,
  getFinancialProfileWithWebLLM,
  projectGoalCompletionWithWebLLM,
  generateAutomaticBudgetsWithWebLLM,
  predictFutureBalanceWithWebLLM,
  getTransactionsFromOfflineStorage,
  getAllAvailableTransactions,
};
