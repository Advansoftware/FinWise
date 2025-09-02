'use server';

// import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
// import { chatWithTransactions, ChatInput as ChatInputFlow } from '@/ai/flows/chat-with-transactions';
import { Transaction, AISettings } from '@/lib/types';
import { getFirebase } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { headers } from 'next/headers';
import { getFirebaseAdmin } from '@/lib/firebase-admin';


async function getUserId() {
    const authorization = headers().get('Authorization');
    if (!authorization) {
        throw new Error('Authorization header not found. User is not authenticated.');
    }
    
    const idToken = authorization.split('Bearer ')[1];
    if (!idToken || idToken === 'null' || idToken === 'undefined') {
        throw new Error('ID token not found in Authorization header. User is not authenticated.');
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

async function getSettingsDocRef() {
    const userId = await getUserId();
    const { db: clientDb } = getFirebase(); 
    return doc(clientDb, "users", userId, "settings", "ai");
}

export async function getAISettings(): Promise<AISettings> {
    const settingsRef = await getSettingsDocRef();
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        return docSnap.data() as AISettings;
    } else {
        return { provider: 'ollama', ollamaModel: 'llama3', openAIModel: 'gpt-3.5-turbo' };
    }
}

export async function saveAISettings(settings: AISettings): Promise<void> {
    const settingsRef = await getSettingsDocRef();
    await setDoc(settingsRef, settings);
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
  // try {
  //   const settings = await getAISettings();
  //   const spendingData = JSON.stringify(transactions, null, 2);
  //   const input: SpendingTipInput = { spendingData, settings };
  //   const result = await generateSpendingTip(input);
  //   return result.tip;
  // } catch (error) {
  //   console.error(error);
  //   return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  // }
  return "AI functionality is temporarily disabled.";
}

// export type ChatInputAction = Omit<ChatInputFlow, 'settings'>;

export async function getChatbotResponse(input: any) { // ChatInputAction
    // try {
    //     const settings = await getAISettings();
    //     if ((settings.provider === 'googleai' && !settings.googleAIApiKey) ||
    //         (settings.provider === 'openai' && !settings.openAIApiKey)) {
    //         return "Por favor, configure sua chave de API na página de Configurações para usar o assistente de IA.";
    //     }
        
    //     const fullInput: ChatInputFlow = { ...input, settings };
    //     const result = await chatWithTransactions(fullInput);
    //     return result.response;
    // } catch (error) {
    //     console.error("Error in getChatbotResponse:", error);
    //     return "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique suas configurações de IA e tente novamente.";
    // }
    return "AI functionality is temporarily disabled.";
}


// --- Transaction Actions ---

async function getTransactionsCollectionRef() {
    const userId = await getUserId();
    const { db: clientDb } = getFirebase(); // Usar o DB do cliente
    return collection(clientDb, "users", userId, "transactions");
}


export async function getTransactions(): Promise<Transaction[]> {
    const transactionsCollection = await getTransactionsCollectionRef();
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

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    const transactionsCollection = await getTransactionsCollectionRef();
    const docRef = await addDoc(transactionsCollection, {
        ...transaction,
        date: new Date(transaction.date)
    });
    return docRef.id;
}
