
'use server';

import { Transaction, AISettings, TransactionCategory } from '@/lib/types';
import { getFirebase } from '@/lib/firebase-server';
import { revalidatePath } from 'next/cache';
import { getAI } from '@/ai/genkit';
import { z } from 'zod';
import { generateSpendingTip } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions } from '@/ai/flows/chat-with-transactions';
import { extractReceiptInfo } from '@/ai/flows/extract-receipt-info';
import { suggestCategoryForItem } from '@/ai/flows/suggest-category';
import { ChatInput, ReceiptInfoInput, ReceiptInfoOutput, SuggestCategoryInput, SuggestCategoryOutput } from './ai/ai-types';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, Timestamp, query, where, writeBatch } from 'firebase/firestore';


// --- Firebase Server Instance ---
const getDb = () => {
    // Usa a inicialização do Firebase para o servidor.
    const { db } = getFirebase();
    return db;
};


// --- AI Settings Actions ---

export async function getAISettings(userId: string): Promise<AISettings> {
    const defaultSettings: AISettings = { 
        provider: 'ollama', 
        ollamaModel: 'llama3', 
        ollamaServerAddress: 'http://127.0.0.1:11434',
        openAIModel: 'gpt-3.5-turbo' 
    };
    
    if (!userId) return defaultSettings;
    
    const db = getDb();
    const settingsRef = doc(db, "users", userId, "settings", "ai");

    try {
      const docSnap = await getDoc(settingsRef);
       if (docSnap.exists()) {
        // Os dados do usuário (docSnap.data()) devem sobrescrever os padrões.
        return { ...defaultSettings, ...docSnap.data() } as AISettings;
      }
    } catch(e) {
      console.error("Error getting AI settings from Firestore:", e);
    }
    return defaultSettings;
}

export async function saveAISettings(userId: string, settings: AISettings): Promise<void> {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    const db = getDb();
    const settingsRef = doc(db, "users", userId, "settings", "ai");
    // Use setDoc without merge to ensure old provider data is cleared.
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

export async function getSpendingTip(transactions: Transaction[]): Promise<string> {
  try {
    const result = await generateSpendingTip({ transactions: JSON.stringify(transactions, null, 2) });
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function getFinancialProfile(transactions: Transaction[]): Promise<string> {
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
export async function analyzeTransactions(transactions: Transaction[]): Promise<string> {
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

export async function getChatbotResponse(input: ChatInput) {
    try {
        // Since this is a server action now, we need a userId to get settings
        const settings = await getAISettings(input.transactions[0]?.userId || '');
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

async function getTransactionsCollectionRef(userId: string) {
    if (!userId) throw new Error("User ID required");
    const db = getDb();
    return collection(db, "users", userId, "transactions");
}


export async function getTransactions(userId: string): Promise<Transaction[]> {
    if (!userId) return [];
    const transactionsCollection = await getTransactionsCollectionRef(userId);
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

export async function addTransaction(userId: string, transaction: Omit<Transaction, 'id'>): Promise<string> {
    if (!userId) throw new Error("User ID required");
    const transactionsCollection = await getTransactionsCollectionRef(userId);
    const docRef = await addDoc(transactionsCollection, {
        ...transaction,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date)
    });
    revalidatePath('/(app)', 'layout');
    return docRef.id;
}


// --- Category Actions ---

async function getCategoriesDocRef(userId: string) {
    if (!userId) throw new Error("User ID required");
    const db = getDb();
    return doc(db, "users", userId, "settings", "categories");
}

export async function getCategories(userId: string): Promise<Partial<Record<TransactionCategory, string[]>>> {
    if (!userId) return {};
    const docRef = await getCategoriesDocRef(userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as Partial<Record<TransactionCategory, string[]>>;
    } else {
        // Default categories
        const defaultCategories = {
            "Supermercado": ["Mercearia", "Feira", "Açougue"],
            "Transporte": ["Combustível", "Uber/99", "Metrô/Ônibus"],
            "Restaurante": ["Almoço", "Jantar", "Café"],
            "Contas": ["Aluguel", "Luz", "Água", "Internet"],
            "Entretenimento": ["Cinema", "Show", "Streaming"],
            "Saúde": ["Farmácia", "Consulta"],
        };
        // Save default categories for the new user
        await saveCategories(userId, defaultCategories);
        return defaultCategories;
    }
}

export async function saveCategories(userId: string, categories: Partial<Record<TransactionCategory, string[]>>) {
    if (!userId) throw new Error("User ID required");
    const docRef = await getCategoriesDocRef(userId);
    await setDoc(docRef, categories);
    revalidatePath('/(app)/categories', 'page');
}

export async function deleteTransactionsByCategory(userId: string, category: TransactionCategory) {
    if (!userId) throw new Error("User ID required");
    const db = getDb();
    const transactionsCollection = await getTransactionsCollectionRef(userId);
    const q = query(transactionsCollection, where("category", "==", category));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    revalidatePath('/(app)', 'layout');
}


// --- Export AI flow wrappers ---
// We re-export these from a central place to be used in client components.
export { extractReceiptInfo, suggestCategoryForItem };
export type { ReceiptInfoInput, ReceiptInfoOutput, SuggestCategoryInput, SuggestCategoryOutput };

    