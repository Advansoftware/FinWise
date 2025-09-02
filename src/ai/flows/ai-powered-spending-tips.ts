
'use server';
/**
 * @fileOverview An AI-powered spending tips flow.
 *
 * - generateSpendingTip - A function that generates personalized spending tips based on user spending habits.
 */
import { ai, getPlugins } from '@/ai/genkit';
import { SpendingTipInputSchema, SpendingTipOutputSchema } from '../ai-types';
import type { SpendingTipInput } from '../ai-types';

const generateSpendingTipPrompt = ai.definePrompt({
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
        outputSchema: SpendingTipOutputSchema
    },
    async (input) => {
        const { output } = await generateSpendingTipPrompt(input, {
            plugins: await getPlugins(),
        });
        if (!output) {
            throw new Error("Failed to generate spending tip.");
        }
        return output;
    }
);

export async function generateSpendingTipAction(input: SpendingTipInput) {
    return generateSpendingTip(input);
}
