'use server';
/**
 * @fileOverview An AI flow to project the completion date for a financial goal.
 *
 * - projectGoalCompletion - A function that handles the goal projection process.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { createConfiguredAI, getModelReference } from '../genkit';
import {
  ProjectGoalCompletionInputSchema,
  ProjectGoalCompletionOutputSchema,
} from '../ai-types';
import type { ProjectGoalCompletionInput, ProjectGoalCompletionOutput } from '../ai-types';
import { AICredential } from '@/lib/types';


const promptTemplate = `Você é um planejador financeiro pragmático que projeta quando um usuário atingirá uma meta de economia. Sua tarefa é analisar o histórico de transações do usuário para determinar sua capacidade média de economia mensal.

**Instruções de Cálculo:**
1.  **Encontre o Período**: Determine o número de meses distintos presentes no histórico de transações. Se houver menos de 15 dias de transações, considere como dados insuficientes.
2.  **Calcule a Renda Média Mensal**: Some todas as transações de 'income' e divida pelo número de meses.
3.  **Calcule a Despesa Média Mensal**: Some todas as transações de 'expense' e divida pelo número de meses.
4.  **Calcule o Saldo Médio Mensal (Capacidade de Economia)**: Renda Média - Despesa Média.
5.  **Calcule o Valor Restante para a Meta**: targetAmount - currentAmount.
6.  **Calcule os Meses Restantes**: Valor Restante / Saldo Médio Mensal. Arredonde para cima para o próximo inteiro.

**Dados de Entrada:**
- Meta: {{goalName}}
- Valor Alvo: R$ {{targetAmount}}
- Valor Atual: R$ {{currentAmount}}
- Histórico de Transações do Usuário:
{{{transactions}}}

**Regras de Saída (em Português do Brasil):**
- **Se for possível projetar (Saldo Médio > 0):**
    - Calcule a data de conclusão a partir de hoje (considere hoje como o primeiro dia do mês corrente para simplificar).
    - Preencha 'completionDate' com a data no formato YYYY-MM-DD.
    - Preencha 'projection' com uma frase curta como "em X meses" ou "em 1 ano e Y meses".
- **Se a capacidade de economia for insuficiente (Saldo Médio <= 0):**
    - Deixe 'completionDate' em branco.
    - Defina 'projection' como "Capacidade de economia insuficiente para projetar.".
- **Se não houver dados de transação suficientes (menos de 15 dias de histórico):**
    - Deixe 'completionDate' em branco.
    - Defina 'projection' como "Dados insuficientes para projetar.".
- **A resposta DEVE ser em Português do Brasil.**
`;


export async function projectGoalCompletion(input: ProjectGoalCompletionInput, credential: AICredential): Promise<ProjectGoalCompletionOutput> {
  const configuredAI = createConfiguredAI(credential);
  const model = getModelReference(credential);

  const prompt = configuredAI.definePrompt({
    name: 'projectGoalPrompt',
    input: { schema: ProjectGoalCompletionInputSchema },
    output: { schema: ProjectGoalCompletionOutputSchema },
    model: model,
    prompt: promptTemplate,
  });

  const { output } = await prompt(input);

  if (!output) {
      throw new Error("Failed to project goal completion.");
  }

  return output;
}
