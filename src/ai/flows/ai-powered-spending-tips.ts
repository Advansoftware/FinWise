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

const SpendingTipInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'Uma string contendo os dados de gastos do usuário, incluindo categorias, valores e frequência.'
    ),
});
export type SpendingTipInput = z.infer<typeof SpendingTipInputSchema>;

const SpendingTipOutputSchema = z.object({
  tip: z.string().describe('Uma dica personalizada para reduzir despesas.'),
});
export type SpendingTipOutput = z.infer<typeof SpendingTipOutputSchema>;

export async function generateSpendingTip(input: SpendingTipInput): Promise<SpendingTipOutput> {
  return generateSpendingTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingTipPrompt',
  input: {schema: SpendingTipInputSchema},
  output: {schema: SpendingTipOutputSchema},
  model: 'ollama/llama3',
  prompt: `Você é um consultor financeiro pessoal. Analise os dados de gastos do usuário e forneça uma única dica acionável para reduzir despesas.

Dados de Gastos: {{{spendingData}}}

Dica: `,
});

const generateSpendingTipFlow = ai.defineFlow(
  {
    name: 'generateSpendingTipFlow',
    inputSchema: SpendingTipInputSchema,
    outputSchema: SpendingTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
