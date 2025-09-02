
'use server';
/**
 * @fileOverview A conversational AI flow for answering questions about financial transactions.
 *
 * - chatWithTransactions - A function that handles the conversational process.
 */

import { ai, getPlugins } from '@/ai/genkit';
import { ChatInputSchema, ChatOutputSchema } from '../ai-types';
import type { ChatInput } from '../ai-types';

const chatWithTransactionsPrompt = ai.definePrompt({
    name: 'chatWithTransactionsPrompt',
    input: { schema: ChatInputSchema },
    output: { schema: ChatOutputSchema },
    prompt: `You are FinWise, a helpful and friendly AI financial assistant.
Your role is to answer user questions based on the provided transaction data.
Analyze the user's prompt and the transaction data to provide a clear and helpful response.
Be concise and conversational.
All responses must be in Brazilian Portuguese.

Current conversation history:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

User's financial transactions:
\`\`\`json
{{{jsonStringify transactions}}}
\`\`\`

New user question: {{{prompt}}}

Your answer:
`,
});

export const chatWithTransactions = ai.defineFlow({
    name: 'chatWithTransactions',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema
}, async (input) => {
     const { output } = await chatWithTransactionsPrompt(input, {
        plugins: await getPlugins(),
     });
    if (!output) {
      throw new Error("AI failed to provide a response.");
    }
    return output;
});

export async function chatWithTransactionsAction(input: ChatInput) {
    return chatWithTransactions(input);
}
