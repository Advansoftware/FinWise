
// src/services/ai-actions.ts
'use server';

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
  AICreditLogAction,
  Transaction
} from '@/ai/ai-types';
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

async function getCredentialAndHandleCredits(userId: string, cost: number, action: AICreditLogAction, isFreeAction: boolean = false): Promise<any> {
    const credential = await getActiveAICredential(userId);

    if (credential.provider === 'finwise' || (!credential.provider && process.env.DEFAULT_AI_PROVIDER)) {
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
    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const prompt = configuredAI.definePrompt({
      name: 'financialProfilePrompt',
      input: { schema: FinancialProfileInputSchema },
      output: { schema: FinancialProfileOutputSchema },
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
      input: { schema: AnalyzeTransactionsInputSchema },
      output: { schema: AnalyzeTransactionsOutputSchema },
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

export async function getChatbotResponse(input: ChatInput, userId: string): Promise<string> {
  const credential = await getCredentialAndHandleCredits(userId, 1, 'Chat com Assistente');
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

export async function extractReceiptInfoAction(input: ReceiptInfoInput, userId: string, chosenProviderId: string): Promise<ReceiptInfoOutput> {
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
  const credential = await getCredentialAndHandleCredits(userId, 10, 'Relatório Anual', isFreeAction);
  return generateAnnualReport(input, credential);
}

export async function suggestBudgetAmountAction(input: SuggestBudgetInput, userId: string): Promise<SuggestBudgetOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 2, 'Sugestão de Orçamento');
  return suggestBudgetAmount(input, credential);
}

export async function projectGoalCompletionAction(input: ProjectGoalCompletionInput, userId: string): Promise<ProjectGoalCompletionOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 3, 'Projeção de Meta');
  return projectGoalCompletion(input, credential);
}

export async function generateAutomaticBudgetsAction(input: GenerateAutomaticBudgetsInput, userId: string): Promise<GenerateAutomaticBudgetsOutput> {
  const credential = await getCredentialAndHandleCredits(userId, 5, 'Criação de Orçamentos Automáticos');
  return generateAutomaticBudgets(input, credential);
}

export async function predictFutureBalanceAction(input: PredictFutureBalanceInput, userId: string, forceRefresh: boolean = false): Promise<PredictFutureBalanceOutput> {
  const cost = forceRefresh ? 3 : 0;
  const credential = await getCredentialAndHandleCredits(userId, cost, 'Previsão de Saldo', !forceRefresh);
  return predictFutureBalance(input, credential);
}
