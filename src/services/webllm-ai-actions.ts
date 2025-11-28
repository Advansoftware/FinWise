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
  chat: `Você é o Assistente Financeiro Gastometria, especializado em finanças pessoais.
Responda sempre em Português do Brasil, de forma clara e amigável.
Use os dados financeiros fornecidos para dar respostas personalizadas.
Forneça dicas práticas e acionáveis.
Seja conciso mas completo.`,

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
  if (!transactions.length) return 'Nenhuma transação disponível.';

  const summary = transactions.slice(0, 50).map(t =>
    `- ${t.item}: R$ ${Math.abs(t.amount).toFixed(2)} (${t.type === 'expense' ? 'Despesa' : 'Receita'}) - ${t.category} - ${new Date(t.date).toLocaleDateString('pt-BR')}`
  ).join('\n');

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return `
Resumo Financeiro:
- Total de Receitas: R$ ${totalIncome.toFixed(2)}
- Total de Despesas: R$ ${totalExpenses.toFixed(2)}
- Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}

Últimas Transações:
${summary}
`;
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

  // Inclui histórico de conversa
  let conversationContext = '';
  if (history.length > 0) {
    conversationContext = '\n\nHistórico da conversa:\n' +
      history.slice(-6).map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');
  }

  // Monta o prompt completo
  const fullPrompt = `${financialContext}${conversationContext}\n\nPergunta do usuário: ${prompt}`;

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
  getTransactionsFromOfflineStorage,
  getAllAvailableTransactions,
};
