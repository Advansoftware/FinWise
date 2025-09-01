'use server';

import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
import { Transaction, AISettings } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from "firebase/firestore";

// --- AI Settings Actions ---

/**
 * Fetches the list of available models from the local Ollama server.
 * This is a server action and runs on the server, but is called from the client.
 */
export async function getOllamaModels(): Promise<string[]> {
  try {
    // This fetch is made from the server running the Next.js app, not the client browser.
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) {
      // This error will be logged on the server.
      console.error('Ollama is not running or not accessible at http://127.0.0.1:11434');
      return [];
    }
    const data = await response.json();
    return data.models.map((model: any) => model.name.replace(':latest', ''));
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    // Return empty array to the client, the client-side will handle the user notification.
    return [];
  }
}


// --- Tip Generation Action ---

export async function getSpendingTip(transactions: Transaction[], settings: AISettings) {
  try {
    const spendingData = JSON.stringify(transactions, null, 2);

    const input: SpendingTipInput = { 
        spendingData, 
        provider: settings.provider,
        model: settings.provider === 'ollama' ? settings.ollamaModel : settings.googleAIApiKey
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
