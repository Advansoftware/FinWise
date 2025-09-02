'use server';

import { ChatInput, ChatOutputSchema, ChatInputSchema } from '@/ai/ai-types';
import { createConfiguredAI, getModelReference } from '@/ai/genkit';
import { getAISettings } from '@/app/actions';
import { ZodTypeAny } from 'zod';

export async function chatWithTransactionsAction(input: ChatInput, userId?: string) {
    try {
        // 1. Pega configurações de IA (Firestore > Default)
        const settings = await getAISettings(userId || '');

        if (!settings) {
            throw new Error("Nenhum modelo configurado. Verifique suas configurações de IA.");
        }

        console.log('Settings loaded:', settings); // Debug

        const configuredAI = createConfiguredAI(settings);
        const modelRef = getModelReference(settings);

        console.log('Model reference:', modelRef); // Debug

        // 2. Define prompt com modelo especificado
        const chatWithTransactionsPrompt = configuredAI.definePrompt({
            name: 'chatWithTransactionsPrompt',
            input: { schema: ChatInputSchema as unknown as ZodTypeAny },
            output: { schema: ChatOutputSchema as unknown as ZodTypeAny },
            model: modelRef, // CRUCIAL: especifica o modelo aqui
            prompt: `Você é FinWise, um assistente financeiro amigável. Responda perguntas do usuário com base nas transações fornecidas. Seja claro, objetivo e responda em Português do Brasil.

Histórico da conversa:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

Transações do usuário:
{{{transactionsJSON}}}

Pergunta do usuário: {{{prompt}}}

Sua resposta: `,
        });

        // 3. Executa prompt, enviando o JSON como campo normal
        const { output } = await chatWithTransactionsPrompt({
            ...input,
            transactionsJSON: JSON.stringify(input.transactions, null, 2),
        });

        if (!output) {
            throw new Error("IA não conseguiu gerar resposta.");
        }

        return output;
    } catch (error) {
        console.error('Erro em chatWithTransactionsAction:', error);
        throw error; // Re-throw para que getChatbotResponse possa tratar
    }
}