
'use server';
/**
 * @fileOverview An AI-powered spending tips flow.
 *
 * - generateSpendingTip - A function that generates personalized spending tips based on user spending habits.
 */
import { getAI } from '@/ai/genkit';
import { z } from 'genkit';
import { SpendingTipInputSchema, SpendingTipOutputSchema } from '../ai-types';

export const generateSpendingTip = async (input: z.infer<typeof SpendingTipInputSchema>) => {
    const ai = await getAI();
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
    
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("Failed to generate spending tip.");
    }
    return output;
};

    