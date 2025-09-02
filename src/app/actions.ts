'use server';

import { Transaction, AISettings, TransactionCategory } from '@/lib/types';
import { getFirebase } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, Timestamp, writeBatch, query, where, deleteDoc } from "firebase/firestore";
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getAI } from '@/ai/genkit';
import { z } from 'zod';

import { generateSpendingTip, SpendingTipInput, SpendingTipOutput } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions, ChatInput } from '@/ai/flows/chat-with-transactions';
import { extractReceiptInfo, ReceiptInfoInput, ReceiptInfoOutput } from '@/ai/flows/extract-receipt-info';
import { suggestCategoryForItem, SuggestCategoryInput, SuggestCategoryOutput } from '@/ai/flows/suggest-category';


async function getUserId(idToken: string) {
    if (!idToken || idToken === 'null' || idToken === 'undefined') {
        throw new Error('ID token not found. User is not authenticated.');
    }
    
    try {
        const { auth } = getFirebaseAdmin();
        const decodedToken = await auth.verifyIdToken(idToken, true);
        if (!decodedToken.uid) {
           throw new Error('Invalid token: UID missing.');
        }
        return decodedToken.uid;
    } catch (error) {
        console.error("Token validation error:", error);
        throw new Error(`User authentication failed: ${(error as Error).message}`);
    }
}


// --- AI Settings Actions ---

async function getSettingsCollectionRef(idToken: string) {
    const userId = await getUserId(idToken);
    const { db: clientDb } = getFirebase(); 
    return collection(clientDb, "users", userId, "settings");
}

export async function getAISettings(idToken?: string): Promise<AISettings> {
    const defaultSettings: AISettings = { 
        provider: 'ollama', 
        ollamaModel: 'llama3', 
        ollamaServerAddress: 'http://127.0.0.1:11434',
        openAIModel: 'gpt-3.5-turbo' 
    };
    if (!idToken) return defaultSettings;
    
    const settingsRef = doc(collection(await getSettingsCollectionRef(idToken)), 'ai');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        return { ...defaultSettings, ...docSnap.data() } as AISettings;
    } else {
        return defaultSettings;
    }
}

export async function saveAISettings(idToken: string, settings: AISettings): Promise<void> {
    const settingsRef = doc(collection(await getSettingsCollectionRef(idToken)), 'ai');
    await setDoc(settingsRef, settings);
    revalidatePath('/(app)/settings', 'page');
}


export async function getOllamaModels(serverAddress: string): Promise<string[]> {
  try {
    const response = await fetch(`${serverAddress}/api/tags`, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Ollama is not running or not accessible at ${serverAddress}`);
      return [];
    }
    const data = await response.json();
    return data.models.map((model: any) => model.name.replace(':latest', ''));
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    return [];
  }
}


// --- AI Actions ---

export async function getSpendingTip(idToken: string, transactions: Transaction[]): Promise<string> {
  try {
    const result = await generateSpendingTip({ transactions: JSON.stringify(transactions, null, 2) });
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function getFinancialProfile(idToken: string, transactions: Transaction[]): Promise<string> {
    const ai = await getAI();
    const FinancialProfileInputSchema = z.object({
      transactions: z.string().describe('A JSON string representing an array of user transactions.'),
    });
    const FinancialProfileOutputSchema = z.object({
      profileName: z.string().describe('A creative, catchy name for the user financial profile, in Brazilian Portuguese. E.g., "O Explorador Gastronômico" or "O Economista Equilibrado".'),
      profileDescription: z.string().describe('A short, encouraging, and insightful description of the user spending habits, in Brazilian Portuguese. It should be 1-2 paragraphs long.'),
    });

    const prompt = ai.definePrompt({
        name: 'financialProfilePrompt',
        input: { schema: FinancialProfileInputSchema },
        output: { schema: FinancialProfileOutputSchema },
        prompt: `You are a savvy and positive financial analyst. Based on the user's transaction history, define a financial profile for them. Give them a creative name and a description that summarizes their spending patterns in a friendly and insightful way. Focus on providing a narrative, not just numbers. All output must be in Brazilian Portuguese.

        User's transactions:
        {{{transactions}}}
        `,
    });
    
    try {
        const { output } = await prompt({transactions: JSON.stringify(transactions)});
        if (!output) return "Não foi possível gerar seu perfil. Tente novamente.";
        return `**${output.profileName}**\n\n${output.profileDescription}`;
    } catch (error) {
        console.error(error);
        return "Não foi possível gerar seu perfil. Verifique suas configurações de IA e tente novamente.";
    }
}


const AnalyzeTransactionsOutputSchema = z.object({
  analysis: z.string().describe('A brief, insightful analysis of the provided transactions. Identify patterns, anomalies, or suggestions for recategorization. The output must be in markdown format and in Brazilian Portuguese.'),
});
export async function analyzeTransactions(idToken: string, transactions: Transaction[]): Promise<string> {
  const ai = await getAI();
  const prompt = ai.definePrompt({
    name: 'analyzeTransactionsPrompt',
    input: { schema: z.object({ txns: z.string() }) },
    output: { schema: AnalyzeTransactionsOutputSchema },
    prompt: `You are a meticulous financial auditor. Analyze this small batch of transactions and provide a brief analysis in markdown. Look for anomalies (e.g., unusually high amounts), patterns (e.g., frequent small purchases), or potential recategorization (e.g., a "Padaria" purchase in "Restaurante" could be "Supermercado"). Be concise. All output must be in Brazilian Portuguese.

Transactions:
{{{txns}}}
`,
  });

  try {
    const { output } = await prompt({ txns: JSON.stringify(transactions, null, 2) });
    return output?.analysis || "Nenhuma análise pôde ser gerada.";
  } catch (error) {
    console.error(error);
    return "Ocorreu um erro ao analisar as transações. Verifique suas configurações de IA.";
  }
}

export async function getChatbotResponse(idToken: string, input: ChatInput) {
    try {
        const settings = await getAISettings(idToken);
        if ((settings.provider === 'googleai' && !settings.googleAIApiKey) ||
            (settings.provider === 'openai' && !settings.openAIApiKey)) {
            return "Por favor, configure sua chave de API na página de Configurações para usar o assistente de IA.";
        }
        
        const result = await chatWithTransactions(input);
        return result.response;
    } catch (error) {
        console.error("Error in getChatbotResponse:", error);
        return "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique suas configurações de IA e tente novamente.";
    }
}


// --- Transaction Actions ---

async function getTransactionsCollectionRef(idToken: string) {
    const userId = await getUserId(idToken);
    const { db: clientDb } = getFirebase();
    return collection(clientDb, "users", userId, "transactions");
}


export async function getTransactions(idToken: string): Promise<Transaction[]> {
    const transactionsCollection = await getTransactionsCollectionRef(idToken);
    const querySnapshot = await getDocs(transactionsCollection);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({ 
            id: doc.id, 
            ...data,
            date: (data.date as Timestamp).toDate().toISOString() 
        } as Transaction);
    });
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addTransaction(idToken: string, transaction: Omit<Transaction, 'id'>): Promise<string> {
    const transactionsCollection = await getTransactionsCollectionRef(idToken);
    const docRef = await addDoc(transactionsCollection, {
        ...transaction,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date)
    });
    revalidatePath('/(app)', 'layout');
    return docRef.id;
}


// --- Category Actions ---

async function getCategoriesDocRef(idToken: string) {
    const userId = await getUserId(idToken);
    const { db: clientDb } = getFirebase();
    return doc(clientDb, "users", userId, "settings", "categories");
}

export async function getCategories(idToken: string): Promise<Partial<Record<TransactionCategory, string[]>>> {
    const docRef = await getCategoriesDocRef(idToken);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        // Default categories
        return {
            "Supermercado": ["Mercearia", "Feira", "Açougue"],
            "Transporte": ["Combustível", "Uber/99", "Metrô/Ônibus"],
            "Restaurante": ["Almoço", "Jantar", "Café"],
            "Contas": ["Aluguel", "Luz", "Água", "Internet"],
            "Entretenimento": ["Cinema", "Show", "Streaming"],
            "Saúde": ["Farmácia", "Consulta"],
        };
    }
}

export async function saveCategories(idToken: string, categories: Partial<Record<TransactionCategory, string[]>>) {
    const docRef = await getCategoriesDocRef(idToken);
    await setDoc(docRef, categories);
    revalidatePath('/(app)/categories', 'page');
}

export async function deleteTransactionsByCategory(idToken: string, category: TransactionCategory) {
    const transactionsCollection = await getTransactionsCollectionRef(idToken);
    const q = query(transactionsCollection, where("category", "==", category));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(transactionsCollection.firestore);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    revalidatePath('/(app)', 'layout');
}


// --- Export AI flow wrappers ---
export { extractReceiptInfo, suggestCategoryForItem };
export type { ReceiptInfoInput, ReceiptInfoOutput, SuggestCategoryInput, SuggestCategoryOutput };
