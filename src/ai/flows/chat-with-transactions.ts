
'use server';

import { ChatInput, ChatOutputSchema, ChatInputSchema } from '@/ai/ai-types';
import { createConfiguredAI, getModelReference } from '@/ai/genkit';
import { AISettings } from '@/lib/types';
import { ZodTypeAny } from 'zod';

export async function chatWithTransactions(input: ChatInput, settings: AISettings) {
    const configuredAI = createConfiguredAI(settings);
    const modelRef = getModelReference(settings);

    const chatWithTransactionsPrompt = configuredAI.definePrompt({
        name: 'chatWithTransactionsPrompt',
        input: { schema: ChatInputSchema as unknown as ZodTypeAny },
        output: { schema: ChatOutputSchema as unknown as ZodTypeAny },
        model: modelRef, 
        prompt: `Você é FinWise, um assistente financeiro amigável. Responda perguntas do usuário com base nas transações fornecidas. Seja claro, objetivo e responda em Português do Brasil.

Histórico da conversa:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

Transações do usuário (use como contexto principal):
{{{transactionsJSON}}}

Pergunta do usuário: {{{prompt}}}

Sua resposta: `,
    });

    const { output } = await chatWithTransactionsPrompt({
        ...input,
        transactionsJSON: JSON.stringify(input.transactions, null, 2),
    });

    if (!output) {
        throw new Error("IA não conseguiu gerar resposta.");
    }

    return output;
}
