'use server';

import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
import { Transaction, AISettings } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

// --- AI Settings Actions ---

/**
 * Fetches the list of available models from the local Ollama server.
 */
export async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
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

/**
 * Retrieves AI settings from Firestore.
 */
export async function getAISettings(): Promise<AISettings | null> {
  const docRef = doc(db, "settings", "ai");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as AISettings;
  } else {
    // Return default settings if none are found
    return {
        provider: 'ollama',
        ollamaModel: 'llama3',
    };
  }
}

/**
 * Saves AI settings to Firestore.
 */
export async function saveAISettings(settings: AISettings): Promise<void> {
    const docRef = doc(db, "settings", "ai");
    await setDoc(docRef, settings, { merge: true });
}


// --- Tip Generation Action ---

export async function getSpendingTip(transactions: Transaction[]) {
  try {
    const aiSettings = await getAISettings();
    const spendingData = JSON.stringify(transactions, null, 2);

    const input: SpendingTipInput = { 
        spendingData, 
        provider: aiSettings?.provider || 'ollama',
        model: aiSettings?.provider === 'ollama' ? aiSettings.ollamaModel : aiSettings?.googleAIApiKey
    };

    const result = await generateSpendingTip(input);
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Desculpe, não consegui gerar uma dica agora. Por favor, tente novamente mais tarde.";
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
            // Firestore armazena Timestamps, convertemos para string ISO
            date: data.date.toDate().toISOString() 
        } as Transaction);
    });
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "transactions"), {
        ...transaction,
        date: new Date(transaction.date) // Converte a string de data para um objeto Date do JS
    });
    return docRef.id;
}
