'use server';

import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
import { Transaction } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from "firebase/firestore";

export async function getSpendingTip(transactions: Transaction[], model?: string) {
  try {
    const spendingData = JSON.stringify(transactions, null, 2);
    const input: SpendingTipInput = { spendingData, model };
    const result = await generateSpendingTip(input);
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Desculpe, não consegui gerar uma dica agora. Por favor, tente novamente mais tarde.";
  }
}

// Firestore functions
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
