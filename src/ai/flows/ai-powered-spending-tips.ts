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

const SpendingTipInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'Uma string contendo os dados de gastos do usuário, incluindo categorias, valores e frequência.'
    ),
  provider: z.string().describe('O provedor de IA a ser usado (ex: ollama, googleai).'),
  model: z.string().optional().describe('Opcional. O nome do modelo ou a chave de API.'),
});
export type SpendingTipInput = z.infer<typeof SpendingTipInputSchema>;

const SpendingTipOutputSchema = z.object({
  tip: z.string().describe('Uma dica personalizada para reduzir despesas.'),
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
  async ({ spendingData, provider, model }) => {
    
    let modelToUse: ModelReference;

    if (provider === 'ollama') {
      modelToUse = `ollama/${model || 'llama3'}`;
    } else if (provider === 'googleai') {
        // Para o Google AI, o 'model' conteria a API Key, 
        // mas aqui vamos usar um modelo padrão como gemini-pro.
        // A lógica de API Key seria tratada na configuração do plugin do Genkit,
        // mas por enquanto, vamos assumir que está configurado.
      modelToUse = 'googleai/gemini-1.5-flash';
    } else {
      throw new Error(`Provedor de IA desconhecido: ${provider}`);
    }

    const prompt = ai.definePrompt({
      name: 'spendingTipPrompt',
      input: {schema: z.object({spendingData: z.string()})},
      output: {schema: SpendingTipOutputSchema},
      model: modelToUse,
      prompt: `Você é um consultor financeiro pessoal. Analise os dados de gastos do usuário e forneça uma única dica acionável para reduzir despesas. Seja breve, direto e amigável.

Dados de Gastos: {{{spendingData}}}

Dica: `,
    });

    const {output} = await prompt({spendingData});
    return output!;
  }
);
