'use server';
/**
 * @fileOverview An AI flow to suggest a budget amount for a given category based on past transactions.
 *
 * - suggestBudgetAmount - A function that handles the budget suggestion process.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';

export const SuggestBudgetInputSchema = z.object({
  category: z.string().describe('The category for which to suggest a budget.'),
  transactions: z.string().describe('A JSON string of transactions from the previous month for that category.'),
});
export type SuggestBudgetInput = z.infer<typeof SuggestBudgetInputSchema>;

export const SuggestBudgetOutputSchema = z.object({
  suggestedAmount: z.number().describe('The suggested budget amount, rounded to the nearest whole number.'),
  justification: z.string().describe('A brief, one-sentence justification for the suggested amount in Brazilian Portuguese.'),
});
export type SuggestBudgetOutput = z.infer<typeof SuggestBudgetOutputSchema>;

const prompt = ai.definePrompt({
  name: 'suggestBudgetPrompt',
  input: { schema: SuggestBudgetInputSchema },
  output: { schema: SuggestBudgetOutputSchema },
  prompt: `You are a pragmatic financial advisor. Your goal is to suggest a reasonable monthly budget for a specific category based on the user's spending history from the previous month.

Analyze the provided transactions for the category "{{category}}".

Consider the average spending, but also look for outliers. The suggested budget should be challenging but achievable. Round the suggested amount to a sensible number (e.g., multiples of 10 or 50).

Provide a brief, encouraging, one-sentence justification for your suggestion. The justification must be in Brazilian Portuguese.

Example justification: "This is slightly less than your average, pushing you to save, but still gives you flexibility."

Transactions from last month:
{{{transactions}}}
`,
});

const suggestBudgetFlow = ai.defineFlow(
  {
    name: 'suggestBudgetFlow',
    inputSchema: SuggestBudgetInputSchema,
    outputSchema: SuggestBudgetOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function suggestBudgetAmount(input: SuggestBudgetInput): Promise<SuggestBudgetOutput> {
  const result = await suggestBudgetFlow(input);
    if (!result) {
        throw new Error("Failed to suggest budget amount.");
    }
  return result;
}
