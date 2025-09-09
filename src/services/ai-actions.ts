/**
 * @fileoverview AI Actions - Gastometria AI Services
 * 
 * SISTEMA DE CRÉDITOS:
 * 
 * Créditos são consumidos APENAS ao usar a Gastometria IA (modelo padrão).
 * Se o usuário configurar suas próprias credenciais de IA, o uso é ilimitado.
 * 
 * A Gastometria IA é definida pelo arquivo .env:
 * - DEFAULT_AI_PROVIDER: define o provedor (openai, ollama, googleai)
 * - DEFAULT_OPENAI_MODEL: modelo OpenAI quando provider for openai
 * - DEFAULT_OLLAMA_MODEL: modelo Ollama quando provider for ollama
 * - DEFAULT_OLLAMA_URL: URL do servidor Ollama
 * 
 * CONTROLE DINÂMICO DE CUSTOS:
 * O Chat com Assistente analisa automaticamente a complexidade da pergunta:
 * - Perguntas simples (cumprimentos, ajuda básica): 1 crédito
 * - Perguntas complexas (análises, cálculos, relatórios): 5 créditos
 * 
 * TABELA DE CUSTOS (conforme página de billing):
 * 
 * AÇÕES SIMPLES (1-2 créditos):
 * - Dica Rápida: 1 crédito
 * - Chat com Assistente (perguntas simples): 1 crédito  
 * - Sugestão de Categoria: 1 crédito
 * - Sugestão de Orçamento: 2 créditos
 * - Projeção de Meta: 2 créditos
 * 
 * AÇÕES COMPLEXAS (5 créditos):
 * - Perfil Financeiro: 5 créditos
 * - Análise de Transações: 5 créditos
 * - Relatório Mensal: 5 créditos
 * - Relatório Anual: 5 créditos
 * - Orçamentos Automáticos: 5 créditos
 * - Previsão de Saldo: 5 créditos
 * - Chat com Assistente (perguntas complexas): 5 créditos
 * 
 * AÇÕES DE IMAGEM (10 créditos):
 * - Leitura de Nota Fiscal (OCR): 10 créditos
 * 
 */

'use server';

import { z } from 'zod';
import {
  ChatInput,
  ReceiptInfoInput,
  ReceiptInfoOutput,
  SuggestCategoryInput,
  SuggestCategoryOutput,
  FinancialProfileInput,
  FinancialProfileInputSchema,
  FinancialProfileOutputSchema,
  FinancialProfileOutput,
  AnalyzeTransactionsInputSchema,
  AnalyzeTransactionsOutputSchema,
  GenerateReportInput,
  GenerateReportOutput,
  GenerateAnnualReportInput,
  GenerateAnnualReportOutput,
  SuggestBudgetInput,
  SuggestBudgetOutput,
  ProjectGoalCompletionInput,
  ProjectGoalCompletionOutput,
  GenerateAutomaticBudgetsInput,
  GenerateAutomaticBudgetsOutput,
  PredictFutureBalanceInput,
  PredictFutureBalanceOutput,
  AICreditLogAction
} from '@/ai/ai-types';
import { Transaction } from '@/lib/types';
import { getActiveAICredential } from './settings-service';
import { consumeAICredits } from './credits-service';
import { generateSpendingTip } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions } from '@/ai/flows/chat-with-transactions';
import { extractReceiptInfo } from '@/ai/flows/extract-receipt-info';
import { suggestCategoryForItem } from '@/ai/flows/suggest-category';
import { generateMonthlyReport } from '@/ai/flows/generate-monthly-report';
import { generateAnnualReport } from '@/ai/flows/generate-annual-report';
import { suggestBudgetAmount } from '@/ai/flows/suggest-budget-amount';
import { projectGoalCompletion } from '@/ai/flows/project-goal-completion';
import { generateAutomaticBudgets } from '@/ai/flows/generate-automatic-budgets';
import { predictFutureBalance } from '@/ai/flows/predict-future-balance';
import { createConfiguredAI, getModelReference } from '@/ai/genkit';
import { AICredential } from '@/lib/types';

async function getCredentialAndHandleCredits(userId: string, cost: number, action: AICreditLogAction, isFreeAction: boolean = false): Promise<AICredential> {
  const credential = await getActiveAICredential(userId);

  // Consome créditos APENAS quando usar o Gastometria IA (modelo padrão definido no .env)
  if (credential.id === 'gastometria-ai-default') {
    await consumeAICredits(userId, cost, action, isFreeAction);
  }

  return credential;
}


// --- AI Actions ---

export async function getSpendingTip(transactions: any, userId: string, forceRefresh: boolean = false): Promise<string> {
  const cost = forceRefresh ? 1 : 0;
  const credential = await getCredentialAndHandleCredits(userId, cost, 'Dica Rápida', !forceRefresh);

  try {
    const result = await generateSpendingTip({
      transactions: JSON.stringify(transactions, null, 2)
    }, credential);

    return result.tip;
  } catch (error) {
    console.error('Error generating spending tip:', error);
    if (error instanceof Error) return error.message;
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function getFinancialProfile(input: FinancialProfileInput, userId: string, forceRefresh: boolean = false): Promise<FinancialProfileOutput> {
  const cost = forceRefresh ? 5 : 0;
  const credential = await getCredentialAndHandleCredits(userId, cost, 'Perfil Financeiro', !forceRefresh);

  try {
    if (input.gamificationData) {
      const { generateEnhancedFinancialProfile } = await import('@/ai/flows/enhanced-financial-profile');
      return await generateEnhancedFinancialProfile(input, credential);
    }

    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const prompt = configuredAI.definePrompt({
      name: 'financialProfilePrompt',
      input: { schema: FinancialProfileInputSchema as unknown as z.ZodTypeAny },
      output: { schema: FinancialProfileOutputSchema as unknown as z.ZodTypeAny },
      model: modelRef,
      prompt: `Você é um analista financeiro sagaz e positivo. Sua tarefa é criar um perfil financeiro para o usuário, incluindo um **título criativo** e uma **descrição**.

Para isso, você tem uma hierarquia de dados:
1.  **Relatórios Anuais (annualReports):** Resumos de anos anteriores. Use-os para entender tendências de longo prazo.
2.  **Relatórios Mensais (monthlyReports):** Resumos de meses do ano corrente. Use-os para entender o comportamento no ano atual.
3.  **Transações do Mês Atual (currentMonthTransactions):** Dados do mês corrente. Use-os para entender os hábitos mais recentes.

Com base na combinação dessas informações, defina o perfil do usuário:
-   **profileName**: Crie um nome de arquétipo curto, criativo e em português (Ex: "O Estrategista Cauteloso", "A Exploradora de Sabores", "O Acumulador de Metas").
-   **profileDescription**: Escreva uma descrição curta (2-3 frases) que justifique o nome do perfil, resumindo os padrões de gastos de forma amigável e perspicaz.

Toda a saída deve ser em Português do Brasil.

Relatórios de Anos Anteriores:
{{{annualReports}}}

Relatórios Mensais do Ano Corrente:
{{{monthlyReports}}}

Transações do Mês Atual:
{{{currentMonthTransactions}}}
`,
    });

    const { output } = await prompt(input);

    if (!output) {
      throw new Error("Não foi possível gerar seu perfil. Tente novamente.");
    }
    return output;
  } catch (error) {
    console.error('Error generating financial profile:', error);
    if (error instanceof Error) throw error;
    throw new Error("Não foi possível gerar seu perfil. Verifique suas configurações de IA e tente novamente.");
  }
}

export async function analyzeTransactionsAction(transactions: Transaction[], userId: string): Promise<string> {
  const credential = await getCredentialAndHandleCredits(userId, 5, 'Análise de Transações');
  try {
    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const prompt = configuredAI.definePrompt({
      name: 'analyzeTransactionsPrompt',
      input: { schema: AnalyzeTransactionsInputSchema as unknown as z.ZodTypeAny },
      output: { schema: AnalyzeTransactionsOutputSchema as unknown as z.ZodTypeAny },
      model: modelRef,
      prompt: `You are a meticulous financial auditor. Analyze this small batch of transactions and provide a brief analysis in markdown. Look for anomalies (e.g., unusually high amounts), patterns (e.g., frequent small purchases), or potential recategorization (e.g., a "Padaria" purchase in "Restaurante" could be "Supermercado"). Be concise. All output must be in Brazilian Portuguese.

Transactions:
{{{txns}}}
`,
    });

    const { output } = await prompt({ txns: JSON.stringify(transactions, null, 2) });
    return output?.analysis || "Nenhuma análise pôde ser gerada.";
  } catch (error) {
    console.error('Error analyzing transactions:', error);
    if (error instanceof Error) return error.message;
    return "Ocorreu um erro ao analisar as transações. Verifique suas configurações de IA.";
  }
}

function analyzeQueryComplexity(prompt: string): { cost: number; complexity: 'simple' | 'complex' } {
  const lowerQuery = prompt.toLowerCase();
  const complexKeywords = ['relatório', 'análise', 'analisar', 'resumo', 'detalhado', 'comparar', 'comparação', 'tendência', 'padrão', 'evolução', 'projeção', 'previsão', 'planejamento', 'orçamento', 'meta', 'objetivo', 'estratégia', 'otimização', 'recomendação', 'calcular', 'calcule', 'soma', 'total', 'média', 'porcentagem', 'estatística', 'maior', 'menor', 'máximo', 'mínimo', 'ranking', 'categorizar'];
  const simpleKeywords = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'como vai', 'ajuda', 'como usar', 'o que é', 'para que serve', 'como funciona', 'dica', 'sugestão', 'conselho', 'explicar', 'explique', 'definir'];
  const wordCount = prompt.split(' ').length;
  const hasNumbers = /\d+|R\$|real|reais/.test(prompt);

  if (complexKeywords.some(keyword => lowerQuery.includes(keyword)) || wordCount > 20 || hasNumbers) {
    return { cost: 5, complexity: 'complex' };
  }
  if (simpleKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return { cost: 1, complexity: 'simple' };
  }
  return { cost: 1, complexity: 'simple' };
}

export async function getChatbotResponse(input: ChatInput, userId: string): Promise<string> {
  const { cost } = analyzeQueryComplexity(input.prompt);
  const credential = await getCredentialAndHandleCredits(userId, cost, 'Chat com Assistente');
  try {
    const result = await chatWithTransactions(input, credential);
    return result.response;
  } catch (error) {
    console.error("Error in getChatbotResponse:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    if (errorMessage.includes("ECONNREFUSED")) {
      return "Não foi possível conectar ao servidor Ollama. Verifique se ele está em execução e acessível.";
    }
    if (error instanceof Error) return error.message;
    return "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function extractReceiptInfoAction(input: ReceiptInfoInput, userId: string, chosenProviderId?: string): Promise<ReceiptInfoOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 10, 'Leitura de Nota Fiscal (OCR)');
  return await extractReceiptInfo(input, credential);
}

export async function suggestCategoryForItemAction(input: SuggestCategoryInput, userId: string): Promise<SuggestCategoryOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 1, 'Sugestão de Categoria');
  return suggestCategoryForItem(input, credential);
}

export async function generateMonthlyReportAction(input: GenerateReportInput, userId: string, isFreeAction: boolean = false): Promise<GenerateReportOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 5, 'Relatório Mensal', isFreeAction);
  return generateMonthlyReport(input, credential);
}

export async function generateAnnualReportAction(input: GenerateAnnualReportInput, userId: string, isFreeAction: boolean = false): Promise<GenerateAnnualReportOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 5, 'Relatório Anual', isFreeAction);
  return generateAnnualReport(input, credential);
}

export async function suggestBudgetAmountAction(input: SuggestBudgetInput, userId: string): Promise<SuggestBudgetOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 2, 'Sugestão de Orçamento');
  return suggestBudgetAmount(input, credential);
}

export async function projectGoalCompletionAction(input: ProjectGoalCompletionInput, userId: string): Promise<ProjectGoalCompletionOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 2, 'Projeção de Meta');
  return projectGoalCompletion(input, credential);
}

export async function generateAutomaticBudgetsAction(input: GenerateAutomaticBudgetsInput, userId: string): Promise<GenerateAutomaticBudgetsOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 5, 'Criação de Orçamentos Automáticos');
  return generateAutomaticBudgets(input, credential);
}

export async function predictFutureBalanceAction(input: PredictFutureBalanceInput, userId: string, forceRefresh: boolean = false): Promise<PredictFutureBalanceOutput> {
  const cost = forceRefresh ? 5 : 0;
  const credential = await getCredentialAndHandleCredits(userId, cost, 'Previsão de Saldo', !forceRefresh);
  return predictFutureBalance(input, credential);
}
