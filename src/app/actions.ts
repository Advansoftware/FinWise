'use server';

import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions, ChatInput as ChatInputFlow } from '@/ai/flows/chat-with-transactions';
import { Transaction, AISettings, TransactionCategory } from '@/lib/types';
import { getFirebase } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, Timestamp, writeBatch, query, where, deleteDoc } from "firebase/firestore";
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';


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
    // This function might be called from server components where the token isn't available.
    // In a real-world scenario, you would handle user identification differently on the server.
    // For this example, we'll allow it to proceed, but AI features will require settings.
    const defaultSettings: AISettings = { provider: 'ollama', ollamaModel: 'llama3', openAIModel: 'gpt-3.5-turbo' };
    if (!idToken) return defaultSettings;
    
    const settingsRef = doc(collection(await getSettingsCollectionRef(idToken)), 'ai');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        return docSnap.data() as AISettings;
    } else {
        return defaultSettings;
    }
}

export async function saveAISettings(idToken: string, settings: AISettings): Promise<void> {
    const settingsRef = doc(collection(await getSettingsCollectionRef(idToken)), 'ai');
    await setDoc(settingsRef, settings);
    revalidatePath('/(app)/settings', 'page');
}


export async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', { cache: 'no-store' });
    if (!response.ok) {
      console.error('Ollama is not running or not accessible at http://127.0.0.1:11434');
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

export async function getSpendingTip(idToken: string, transactions: Transaction[]) {
  try {
    const settings = await getAISettings(idToken);
    const spendingData = JSON.stringify(transactions, null, 2);
    const input: SpendingTipInput = { spendingData, settings };
    const result = await generateSpendingTip(input);
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

export type ChatInputAction = Omit<ChatInputFlow, 'settings'>;

export async function getChatbotResponse(idToken: string, input: ChatInputAction) {
    try {
        const settings = await getAISettings(idToken);
        if ((settings.provider === 'googleai' && !settings.googleAIApiKey) ||
            (settings.provider === 'openai' && !settings.openAIApiKey)) {
            return "Por favor, configure sua chave de API na página de Configurações para usar o assistente de IA.";
        }
        
        const fullInput: ChatInputFlow = { ...input, settings };
        const result = await chatWithTransactions(fullInput);
        return result.response;
    } catch (error) {
        console.error("Error in getChatbotResponse:", error);
        return "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique suas configurações de IA e tente novamente.";
    }
}


// --- Transaction Actions ---

async function getTransactionsCollectionRef(idToken: string) {
    const userId = await getUserId(idToken);
    const { db: clientDb } = getFirebase(); // Usar o DB do cliente
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