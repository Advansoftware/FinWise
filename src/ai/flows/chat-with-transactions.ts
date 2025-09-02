'use server';
/**
 * @fileOverview A conversational AI flow for answering questions about financial transactions.
 *
 * - chatWithTransactions - A function that handles the conversational process.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { ModelReference } from 'genkit/model';
import { AISettings, Transaction } from '@/lib/types';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai/openai';


const ChatInputSchema = z.object({
  history: z.array(z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
  })),
  prompt: z.string().describe("The user's question or prompt."),
  transactions: z.array(z.custom<Transaction>()).describe("An array of the user's financial transactions."),
  settings: z.custom<AISettings>().describe("The user's AI provider and model settings.")
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user\'s prompt.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithTransactions(input: ChatInput): Promise<ChatOutput> {
  return chatWithTransactionsFlow(input);
}


const chatWithTransactionsFlow = ai.defineFlow(
  {
    name: 'chatWithTransactionsFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, prompt, transactions, settings }) => {

    let modelToUse: ModelReference;
    let providerPlugins: any[] = [];

    switch (settings.provider) {
        case 'googleai':
            modelToUse = googleAI.model('gemini-1.5-flash');
             if (settings.googleAIApiKey) {
                providerPlugins.push(googleAI({apiKey: settings.googleAIApiKey}));
            }
            break;
        case 'openai':
            modelToUse = settings.openAIModel === 'gpt-4' ? openAI.model('gpt-4') : openAI.model('gpt-3.5-turbo');
             if (settings.openAIApiKey) {
                providerPlugins.push(openAI({apiKey: settings.openAIApiKey}));
            }
            break;
        case 'ollama':
             // Ollama support to be added.
            throw new Error('Ollama provider not yet implemented.');
        default:
            throw new Error(`Unknown AI provider: ${settings.provider}`);
    }

    const dynamicAi = ai.configure({
        plugins: providerPlugins
    });

    const transactionData = JSON.stringify(transactions, null, 2);
    const currentDate = new Date().toISOString().split('T')[0];

    const model = dynamicAi.getGenerator(modelToUse)!;
    
    const {output} = await model.generate({
        system: `You are FinWise, an expert financial assistant. Your role is to analyze a user's transaction data and answer their questions clearly and concisely.

- Today's date is ${currentDate}. When a user asks about "this month" or "current month", you must use this date to determine the correct date range.
- The user's transaction data is provided below in JSON format. Use this data exclusively to answer questions. Do not make up information.
- If you perform a calculation (like summing up expenses), always state the total.
- If a question is ambiguous or you cannot answer it with the data provided, say so and explain why. For example, if asked about a specific store and there are no transactions for it, state that.
- Keep your answers brief and to the point.

Transaction Data:
\`\`\`json
${transactionData}
\`\`\`
`,
        history: history.map(h => ({
            role: h.role,
            content: [{ text: h.content }]
        })),
        prompt: prompt,
        output: {
            schema: ChatOutputSchema,
        }
    });

    return output!;
  }
);
