
'use server';

import { Transaction, AICredential } from '@/lib/types';
import { z } from 'zod';
import { generateSpendingTip } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions } from '@/ai/flows/chat-with-transactions';
import { extractReceiptInfo } from '@/ai/flows/extract-receipt-info';
import { suggestCategoryForItem } from '@/ai/flows/suggest-category';
import {
  ChatInput,
  ReceiptInfoInput,
  ReceiptInfoOutput,
  SuggestCategoryInput,
  SuggestCategoryOutput,
  FinancialProfileInputSchema,
  FinancialProfileOutputSchema,
  AnalyzeTransactionsInputSchema,
  AnalyzeTransactionsOutputSchema
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

export async function getFinancialProfile(transactions: Transaction[], userId: string): Promise<string> {
  try {
    const credential = await getActiveAICredential(userId);
    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const prompt = configuredAI.definePrompt({
      name: 'financialProfilePrompt',
      input: { schema: FinancialProfileInputSchema },
      output: { schema: FinancialProfileOutputSchema },
      model: modelRef,
      prompt: `You are a savvy and positive financial analyst. Based on the user's transaction history, define a financial profile for them. Give them a creative name and a description that summarizes their spending patterns in a friendly and insightful way. Focus on providing a narrative, not just numbers. All output must be in Brazilian Portuguese.

User's transactions:
{{{transactions}}}
`,
    });

    const { output } = await prompt({ transactions: JSON.stringify(transactions) });

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
