'use server';

import { generateSpendingTip, SpendingTipInput } from '@/ai/flows/ai-powered-spending-tips';
import { mockTransactions } from '@/lib/data';

export async function getSpendingTip() {
  try {
    const spendingData = JSON.stringify(mockTransactions, null, 2);
    const input: SpendingTipInput = { spendingData };
    const result = await generateSpendingTip(input);
    return result.tip;
  } catch (error) {
    console.error(error);
    return "Sorry, I couldn't generate a tip right now. Please try again later.";
  }
}
