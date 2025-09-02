'use server';
/**
 * @fileOverview An AI-powered spending tips flow.
 *
 * - generateSpendingTip - A function that generates personalized spending tips based on user spending habits.
 * - SpendingTipInput - The input type for the generateSpendingTip function.
 * - SpendingTipOutput - The return type for the generateSpendingTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ModelReference } from 'genkit/model';
import { AISettings } from '@/lib/types';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai/openai';


const SpendingTipInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A JSON string of the user\'s spending data, including categories, amounts, and frequency.'
    ),
  settings: z.custom<AISettings>()
});
export type SpendingTipInput = z.infer<typeof SpendingTipInputSchema>;

const SpendingTipOutputSchema = z.object({
  tip: z.string().describe('A single, actionable tip to reduce expenses.'),
});
export type SpendingTipOutput = z.infer<typeof SpendingTipOutputSchema>;

export async function generateSpendingTip(input: SpendingTipInput): Promise<SpendingTipOutput> {
  return generateSpendingTipFlow(input);
}

const generateSpendingTipFlow = ai.defineFlow(
  {
    name: 'generateSpendingTipFlow',
    inputSchema: SpendingTipInputSchema,
    outputSchema: SpendingTipOutputSchema,
  },
  async ({ spendingData, settings }) => {
    
    let modelToUse: ModelReference;
    let providerPlugins: any[] = [];

    switch (settings.provider) {
        case 'googleai':
            modelToUse = 'googleai/gemini-1.5-flash';
            if (settings.googleAIApiKey) {
                providerPlugins.push(googleAI({apiKey: settings.googleAIApiKey}));
            }
            break;
        case 'openai':
            modelToUse = settings.openAIModel === 'gpt-4' ? 'openai/gpt-4' : 'openai/gpt-3.5-turbo';
            if (settings.openAIApiKey) {
                providerPlugins.push(openAI({apiKey: settings.openAIApiKey}));
            }
            break;
        case 'ollama':
            modelToUse = `ollama/${settings.ollamaModel || 'llama3'}`;
            break;
        default:
            throw new Error(`Unknown AI provider: ${settings.provider}`);
    }

    // Configure Genkit dynamically for this flow execution
    const dynamicAi = ai.configure({
        plugins: providerPlugins
    });

    const model = dynamicAi.getGenerator(modelToUse)!;

    const {output} = await model.generate({
        prompt: `You are a personal finance advisor. Analyze the user's spending data and provide a single, actionable tip to reduce expenses. Be brief, direct, and friendly.

Spending Data (JSON format):
\`\`\`json
${spendingData}
\`\`\`

Based on this data, provide one clear, concise tip.

Tip: `,
        output: {
            schema: SpendingTipOutputSchema,
        }
    });

    return output!;
  }
);
