'use server';
/**
 * @fileOverview A conversational AI flow for answering questions about financial transactions.
 *
 * - chatWithTransactions - A function that handles the conversational process.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { Transaction } from '@/lib/types';
import { z } from 'genkit';

const MessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

export const ChatInputSchema = z.object({
    history: z.array(MessageSchema).describe('The conversation history.'),
    prompt: z.string().describe('The latest user prompt.'),
    transactions: z.array(z.any()).describe("A JSON array of the user's financial transactions."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


export const ChatOutputSchema = z.object({
    response: z.string().describe('The AI-generated response to the user.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


const prompt = ai.definePrompt({
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


export const chatWithTransactions = ai.defineFlow(
  {
    name: 'chatWithTransactions',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
