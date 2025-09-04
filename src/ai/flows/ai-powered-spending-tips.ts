
'use server';
/**
 * @fileOverview An AI-powered spending tips flow.
 *
 * - generateSpendingTip - A function that generates personalized spending tips based on user spending habits.
 */
import { type ZodTypeAny } from 'zod';
import { SpendingTipInputSchema, SpendingTipOutputSchema } from '../ai-types';
import type { SpendingTipInput } from '../ai-types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { AICredential } from '@/lib/types';

const promptTemplate = `You are a friendly and encouraging financial advisor.
Analyze the following JSON data of a user's recent transactions and provide ONE concise, actionable, and positive tip to help them improve their spending habits.
Focus on the largest spending category or a recurring pattern.
The response should be in Brazilian Portuguese.
Keep the tip under 280 characters.

Example: "Percebi que a maior parte dos seus gastos foi em restaurantes. Que tal tentar cozinhar em casa uma vez a mais por semana? Pode ser divertido e econômico!"

User's transactions:
{{{transactions}}}
`;

export async function generateSpendingTip(input: SpendingTipInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const model = getModelReference(credential);
    
    const prompt = configuredAI.definePrompt({
        name: 'generateSpendingTipPrompt',
        input: { schema: SpendingTipInputSchema as unknown as ZodTypeAny },
        output: { schema: SpendingTipOutputSchema as unknown as ZodTypeAny },
        model: model,
        prompt: promptTemplate
    });

    const { output } = await prompt(input);
    if (!output) {
        throw new Error("Failed to generate spending tip.");
    }
    return output;
}
