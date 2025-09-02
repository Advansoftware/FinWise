'use server';
/**
 * @fileOverview An AI-powered spending tips flow.
 *
 * - generateSpendingTip - A function that generates personalized spending tips based on user spending habits.
 * - SpendingTipInput - The input type for the generateSpendingTip function.
 * - SpendingTipOutput - The return type for the generateSpendingTip function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SpendingTipInputSchema = z.object({
  transactions: z.string().describe('A JSON string representing an array of user transactions.'),
});
export type SpendingTipInput = z.infer<typeof SpendingTipInputSchema>;

export const SpendingTipOutputSchema = z.object({
  tip: z.string().describe('A personalized, actionable spending tip.'),
});
export type SpendingTipOutput = z.infer<typeof SpendingTipOutputSchema>;

const prompt = ai.definePrompt({
    name: 'generateSpendingTipPrompt',
    input: { schema: SpendingTipInputSchema },
    output: { schema: SpendingTipOutputSchema },
    prompt: `You are a friendly and encouraging financial advisor.
    Analyze the following JSON data of a user's recent transactions and provide ONE concise, actionable, and positive tip to help them improve their spending habits.
    Focus on the largest spending category or a recurring pattern.
    The response should be in Brazilian Portuguese.
    Keep the tip under 280 characters.

    Example: "Percebi que a maior parte dos seus gastos foi em restaurantes. Que tal tentar cozinhar em casa uma vez a mais por semana? Pode ser divertido e econômico!"

    User's transactions:
    {{{transactions}}}
    `,
});

export const generateSpendingTip = ai.defineFlow(
  {
    name: 'generateSpendingTip',
    inputSchema: SpendingTipInputSchema,
    outputSchema: SpendingTipOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
