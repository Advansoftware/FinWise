'use server';
/**
 * @fileOverview An AI flow to project the completion date for a financial goal.
 *
 * - projectGoalCompletion - A function that handles the goal projection process.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import {
  ProjectGoalCompletionInputSchema,
  ProjectGoalCompletionOutputSchema,
} from '../ai-types';
import type { ProjectGoalCompletionInput, ProjectGoalCompletionOutput } from '../ai-types';

const prompt = ai.definePrompt({
  name: 'projectGoalPrompt',
  input: { schema: ProjectGoalCompletionInputSchema },
  output: { schema: ProjectGoalCompletionOutputSchema },
  prompt: `Você é um planejador financeiro que projeta quando um usuário atingirá uma meta de economia.

Sua tarefa é analisar o histórico de transações do usuário para determinar sua capacidade média de economia mensal.

1.  **Calcule a Renda Média Mensal**: Some todas as transações de 'income' e divida pelo número de meses nos dados.
2.  **Calcule a Despesa Média Mensal**: Some todas as transações de 'expense' e divida pelo número de meses.
3.  **Calcule o Saldo Médio Mensal (Capacidade de Economia)**: Renda Média - Despesa Média.
4.  **Calcule o Valor Restante para a Meta**: targetAmount - currentAmount.
5.  **Calcule os Meses Restantes**: Valor Restante / Saldo Médio Mensal.

Se o Saldo Médio for zero ou negativo, você não pode fazer uma projeção.

Com base nos meses restantes, calcule a data de conclusão a partir de hoje.

**Dados de Entrada:**
- Meta: {{goalName}}
- Valor Alvo: {{targetAmount}}
- Valor Atual: {{currentAmount}}
- Histórico de Transações:
{{{transactions}}}

**Regras de Saída:**
- Se for possível projetar, preencha 'completionDate' com a data no formato YYYY-MM-DD e 'projection' com uma frase como "Em X meses".
- Se a capacidade de economia for insuficiente, deixe 'completionDate' em branco e defina 'projection' como "Capacidade de economia insuficiente para projetar.".
- Se não houver dados de transação suficientes (menos de um mês), deixe 'completionDate' em branco e defina 'projection' como "Dados insuficientes para projetar.".
- A resposta DEVE ser em Português do Brasil.
`,
});

const projectGoalFlow = ai.defineFlow(
  {
    name: 'projectGoalFlow',
    inputSchema: ProjectGoalCompletionInputSchema,
    outputSchema: ProjectGoalCompletionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function projectGoalCompletion(input: ProjectGoalCompletionInput): Promise<ProjectGoalCompletionOutput> {
  const result = await projectGoalFlow(input);
    if (!result) {
        throw new Error("Failed to project goal completion.");
    }
  return result;
}
