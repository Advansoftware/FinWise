
'use server';

import { Transaction, AICredential, MonthlyReport } from '@/lib/types';
import { z } from 'zod';
import { generateSpendingTip } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions } from '@/ai/flows/chat-with-transactions';
import { extractReceiptInfo } from '@/ai/flows/extract-receipt-info';
import { suggestCategoryForItem } from '@/ai/flows/suggest-category';
import { generateMonthlyReport } from '@/ai/flows/generate-monthly-report';
import { generateAnnualReport } from '@/ai/flows/generate-annual-report';
import {
  ChatInput,
  ReceiptInfoInput,
  ReceiptInfoOutput,
  SuggestCategoryInput,
  SuggestCategoryOutput,
  FinancialProfileInput,
  FinancialProfileInputSchema,
  FinancialProfileOutputSchema,
  AnalyzeTransactionsInputSchema,
  AnalyzeTransactionsOutputSchema,
  GenerateReportInput,
  GenerateReportOutput,
  GenerateAnnualReportInput,
  GenerateAnnualReportOutput
} from '@/ai/ai-types';
import { createConfiguredAI, getModelReference } from '@/ai/genkit';
import { getAdminApp } from '@/lib/firebase-admin';

// Default AI settings for fallback ONLY.
const DEFAULT_AI_CREDENTIAL: AICredential = {
  id: 'default-fallback',
  name: 'Default Fallback Ollama',
  provider: 'ollama',
  ollamaModel: 'llama3',
  ollamaServerAddress: 'http://127.0.0.1:11434',
  openAIModel: 'gpt-3.5-turbo'
};

// Server action to get AI settings using Admin SDK
export async function getActiveAICredential(userId: string): Promise<AICredential> {
  if (!userId) {
    console.warn("getActiveAICredential called without a userId. Returning default settings.");
    return DEFAULT_AI_CREDENTIAL;
  }

  try {
    const adminDb = getAdminApp().firestore();
    const settingsRef = adminDb.doc(`users/${userId}/settings/ai`);
    const docSnap = await settingsRef.get();

    if (docSnap.exists) {
        const settings = docSnap.data();
        if (settings && settings.activeCredentialId && settings.credentials) {
            const activeCredential = settings.credentials.find((c: AICredential) => c.id === settings.activeCredentialId);
            if (activeCredential) {
                // Merge with defaults to ensure all fields are present
                return { ...DEFAULT_AI_CREDENTIAL, ...activeCredential };
            }
        }
    }
    
    // No active/valid credential found for this user, return defaults
    return DEFAULT_AI_CREDENTIAL;
  } catch (error) {
    console.error("Error getting AI settings from Firestore with Admin SDK:", error);
    // In case of error (e.g., permissions), return defaults to avoid breaking the app
    return DEFAULT_AI_CREDENTIAL;
  }
}


// --- AI Actions ---

export async function getSpendingTip(transactions: Transaction[], userId: string): Promise<string> {
  try {
    const credential = await getActiveAICredential(userId);
    const result = await generateSpendingTip({
      transactions: JSON.stringify(transactions, null, 2)
    }, credential);

    return result.tip;
  } catch (error) {
    console.error('Error generating spending tip:', error);
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function getFinancialProfile(input: FinancialProfileInput, userId: string): Promise<string> {
  try {
    const credential = await getActiveAICredential(userId);
    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const prompt = configuredAI.definePrompt({
      name: 'financialProfilePrompt',
      input: { schema: FinancialProfileInputSchema },
      output: { schema: FinancialProfileOutputSchema },
      model: modelRef,
      prompt: `Você é um analista financeiro sagaz e positivo. Sua tarefa é criar um perfil financeiro para o usuário.

Para isso, você tem uma hierarquia de dados:
1.  **Relatórios Anuais (annualReports):** Resumos de anos anteriores. Use-os para entender tendências de longo prazo.
2.  **Relatórios Mensais (monthlyReports):** Resumos de meses do ano corrente. Use-os para entender o comportamento no ano atual.
3.  **Transações do Mês Atual (currentMonthTransactions):** Dados do mês corrente. Use-os para entender os hábitos mais recentes.

Com base na combinação dessas informações, defina um perfil financeiro para o usuário. Dê um nome criativo e uma descrição que resuma seus padrões de gastos de forma amigável e perspicaz. Foque em fornecer uma narrativa, não apenas números. Toda a saída deve ser em Português do Brasil.

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
      return "Não foi possível gerar seu perfil. Tente novamente.";
    }

    return `**${output.profileName}**\n\n${output.profileDescription}`;
  } catch (error) {
    console.error('Error generating financial profile:', error);
    return "Não foi possível gerar seu perfil. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function analyzeTransactions(transactions: Transaction[], userId: string): Promise<string> {
  try {
    const credential = await getActiveAICredential(userId);
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
    return "Ocorreu um erro ao analisar as transações. Verifique suas configurações de IA.";
  }
}

export async function getChatbotResponse(input: ChatInput, userId: string): Promise<string> {
  try {
    const credential = await getActiveAICredential(userId);
    const result = await chatWithTransactions(input, credential);
    return result.response;
  } catch (error) {
    console.error("Error in getChatbotResponse:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    if (errorMessage.includes("ECONNREFUSED")){
       return "Não foi possível conectar ao servidor Ollama. Verifique se ele está em execução e acessível.";
    }
    return "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function extractReceiptInfoAction(input: ReceiptInfoInput, userId: string): Promise<ReceiptInfoOutput> {
    const credential = await getActiveAICredential(userId);
    return extractReceiptInfo(input, credential);
}

export async function suggestCategoryForItemAction(input: SuggestCategoryInput, userId: string): Promise<SuggestCategoryOutput> {
    const credential = await getActiveAICredential(userId);
    return suggestCategoryForItem(input, credential);
}

export async function generateMonthlyReportAction(input: GenerateReportInput, userId: string): Promise<GenerateReportOutput> {
  const credential = await getActiveAICredential(userId);
  return generateMonthlyReport(input, credential);
}

export async function generateAnnualReportAction(input: GenerateAnnualReportInput, userId: string): Promise<GenerateAnnualReportOutput> {
  const credential = await getActiveAICredential(userId);
  return generateAnnualReport(input, credential);
}
