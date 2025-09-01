'use server';

import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions, ChatInput as ChatInputFlow } from '@/ai/flows/chat-with-transactions';
import { Transaction, AISettings } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

// --- AI Settings Actions ---

const settingsDocRef = doc(db, "settings", "ai");

export async function getAISettings(): Promise<AISettings> {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as AISettings;
    } else {
        // Return default settings if none are found in Firestore
        return { provider: 'ollama', ollamaModel: 'llama3', openAIModel: 'gpt-3.5-turbo' };
    }
}

export async function saveAISettings(settings: AISettings): Promise<void> {
    await setDoc(settingsDocRef, settings);
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

export async function getSpendingTip(transactions: Transaction[]) {
  try {
    const settings = await getAISettings();
    const spendingData = JSON.stringify(transactions, null, 2);
    const input: SpendingTipInput = { spendingData, settings };
    const result = await generateSpendingTip(input);
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

// We redefine the ChatInput type for the action to exclude the settings,
// as we will fetch them on the server.
export type ChatInputAction = Omit<ChatInputFlow, 'settings'>;

export async function getChatbotResponse(input: ChatInputAction) {
    try {
        const settings = await getAISettings();
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

export async function getTransactions(): Promise<Transaction[]> {
    const querySnapshot = await getDocs(collection(db, "transactions"));
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({ 
            id: doc.id, 
            ...data,
            // Firestore stores Timestamps, we convert to ISO string for the client
            date: data.date.toDate().toISOString() 
        } as Transaction);
    });
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "transactions"), {
        ...transaction,
        date: new Date(transaction.date) // Convert date string back to JS Date object for Firestore
    });
    return docRef.id;
}
