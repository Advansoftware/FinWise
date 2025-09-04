
'use server';
/**
 * @fileOverview An AI flow to suggest a budget amount for a given category based on past transactions.
 *
 * - suggestBudgetAmount - A function that handles the budget suggestion process.
 */
import { z } from 'zod';
import { AICredential } from '@/lib/types';
import { createConfiguredAI, getModelReference } from '../genkit';
import {
  SuggestBudgetInput,
  SuggestBudgetInputSchema,
  SuggestBudgetOutputSchema
} from '../ai-types';


const promptTemplate = `You are a pragmatic financial advisor. Your goal is to suggest a reasonable monthly budget for a specific category based on the user's spending history from the previous month.

Analyze the provided transactions for the category "{{category}}".

Consider the average spending, but also look for outliers. The suggested budget should be challenging but achievable. Round the suggested amount to a sensible number (e.g., multiples of 10 or 50).

Provide a brief, encouraging, one-sentence justification for your suggestion. The justification must be in Brazilian Portuguese.

Example justification: "This is slightly less than your average, pushing you to save, but still gives you flexibility."

Transactions from last month:
{{{transactions}}}
`;

export async function suggestBudgetAmount(input: SuggestBudgetInput, credential: AICredential) {
  const configuredAI = createConfiguredAI(credential);
  const model = getModelReference(credential);

  const prompt = configuredAI.definePrompt({
    name: 'suggestBudgetPrompt',
    input: { schema: SuggestBudgetInputSchema as z.ZodTypeAny },
    output: { schema: SuggestBudgetOutputSchema as z.ZodTypeAny },
    model: model,
    prompt: promptTemplate,
  });

  const { output } = await prompt(input);
  if (!output) {
      throw new Error("Failed to suggest budget amount.");
  }
  return output;
}
