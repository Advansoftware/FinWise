'use server';

import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
import { Transaction } from '@/lib/types';

export async function getSpendingTip(transactions: Transaction[]) {
  try {
    const spendingData = JSON.stringify(transactions, null, 2);
    const input: SpendingTipInput = { spendingData };
    const result = await generateSpendingTip(input);
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Desculpe, não consegui gerar uma dica agora. Por favor, tente novamente mais tarde.";
  }
}
