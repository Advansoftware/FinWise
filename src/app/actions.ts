'use server';

import { Transaction, AISettings } from '@/lib/types';
import { ai, createConfiguredAI, getModelReference } from '@/ai/genkit';
import { z } from 'zod';
import { generateSpendingTipAction } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactionsAction } from '@/ai/flows/chat-with-transactions';
import { extractReceiptInfoAction } from '@/ai/flows/extract-receipt-info';
import { suggestCategoryForItemAction } from '@/ai/flows/suggest-category';
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
import { getFirebase } from "@/lib/firebase";
import { doc, getDoc } from 'firebase/firestore';

// Default AI settings - duplicated here to avoid import issues
const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'ollama',
  ollamaModel: 'llama3',
  ollamaServerAddress: 'http://127.0.0.1:11434',
  openAIModel: 'gpt-3.5-turbo'
};

// Server action to get AI settings
export async function getAISettings(userId: string): Promise<AISettings> {
  if (!userId) {
    return DEFAULT_AI_SETTINGS;
  }

  try {
    const { db } = getFirebase();
    const settingsRef = doc(db, "users", userId, "settings", "ai");
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
      return { ...DEFAULT_AI_SETTINGS, ...docSnap.data() } as AISettings;
    }

    return DEFAULT_AI_SETTINGS;
  } catch (error) {
    console.error("Error getting AI settings from Firestore:", error);
    return DEFAULT_AI_SETTINGS;
  }
}

// --- AI Actions ---

export async function getSpendingTip(transactions: Transaction[], userId?: string): Promise<string> {
  try {
    const settings = userId ? await getAISettings(userId) : DEFAULT_AI_SETTINGS;
    console.log('Getting spending tip with settings:', settings);

    const result = await generateSpendingTipAction({
      transactions: JSON.stringify(transactions, null, 2)
    });

    return result.tip;
  } catch (error) {
    console.error('Error generating spending tip:', error);
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function getFinancialProfile(transactions: Transaction[], userId?: string): Promise<string> {
  try {
    const settings = userId ? await getAISettings(userId) : DEFAULT_AI_SETTINGS;
    const configuredAI = createConfiguredAI(settings);
    const modelRef = getModelReference(settings);

    console.log('Financial profile - Model reference:', modelRef);

    const prompt = configuredAI.definePrompt({
      name: 'financialProfilePrompt',
      input: { schema: FinancialProfileInputSchema },
      output: { schema: FinancialProfileOutputSchema },
      model: modelRef, // Especifica o modelo
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

export async function analyzeTransactions(transactions: Transaction[], userId?: string): Promise<string> {
  try {
    const settings = userId ? await getAISettings(userId) : DEFAULT_AI_SETTINGS;
    const configuredAI = createConfiguredAI(settings);
    const modelRef = getModelReference(settings);

    console.log('Analyze transactions - Model reference:', modelRef);

    const prompt = configuredAI.definePrompt({
      name: 'analyzeTransactionsPrompt',
      input: { schema: AnalyzeTransactionsInputSchema },
      output: { schema: AnalyzeTransactionsOutputSchema },
      model: modelRef, // Especifica o modelo
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

export async function getChatbotResponse(input: ChatInput, userId?: string): Promise<string> {
  try {
    console.log('Getting chatbot response for user:', userId);
    console.log('Chat input:', {
      historyLength: input.history?.length || 0,
      prompt: input.prompt,
      transactionsLength: input.transactions?.length || 0
    });

    const result = await chatWithTransactionsAction(input, userId);
    console.log('Chatbot response received:', result);
    return result.response;
  } catch (error) {
    console.error("Error in getChatbotResponse:", error);
    return "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique suas configurações de IA e tente novamente.";
  }
}

// --- Export AI flow wrappers ---
// We re-export these from a central place to be used in client components.
export { extractReceiptInfoAction, suggestCategoryForItemAction };
export type { ReceiptInfoInput, ReceiptInfoOutput, SuggestCategoryInput, SuggestCategoryOutput };