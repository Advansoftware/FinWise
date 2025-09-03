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


const promptTemplate = `Você é um planejador financeiro pragmático que projeta quando um usuário atingirá uma meta de economia. Sua tarefa é analisar os dados fornecidos e retornar uma projeção clara.

**Hierarquia de Dados para Projeção (USE ESTA ORDEM):**
1.  **Depósito Mensal (monthlyDeposit):** Se este valor for fornecido, USE-O como a capacidade de economia mensal. É a informação mais importante. Ignore o histórico de transações para o cálculo principal.
2.  **Data Alvo (targetDate):** Se fornecida (e o depósito mensal não), sua tarefa é calcular QUAL o valor mensal necessário para atingir a meta até essa data.
3.  **Histórico de Transações (transactions):** Se NENHUM dos anteriores for fornecido, analise o histórico de transações para estimar uma capacidade de economia mensal (receita média - despesa média).

**Dados de Entrada:**
- Meta: {{goalName}}
- Valor Alvo: R$ {{targetAmount}}
- Valor Atual: R$ {{currentAmount}}
- Depósito Mensal Planejado: R$ {{#if monthlyDeposit}}{{monthlyDeposit}}{{else}}Não informado{{/if}}
- Data Alvo: {{#if targetDate}}{{targetDate}}{{else}}Não informada{{/if}}
- Histórico de Transações do Usuário:
{{{transactions}}}

**Regras de Saída (em Português do Brasil):**
- **Cenário 1 (monthlyDeposit informado):**
    - Calcule os meses restantes: (targetAmount - currentAmount) / monthlyDeposit. Arredonde para cima.
    - Preencha 'completionDate' com a data futura no formato YYYY-MM-DD.
    - Preencha 'projection' com uma frase como "em X meses".
- **Cenário 2 (targetDate informado):**
    - Calcule os meses até a data alvo.
    - Calcule o depósito mensal necessário: (targetAmount - currentAmount) / meses.
    - Preencha 'requiredMonthlyDeposit' com o valor calculado.
    - Preencha 'projection' com "Para atingir a meta, economize R$X por mês.".
    - Deixe 'completionDate' em branco.
- **Cenário 3 (nenhum dos dois informado):**
    - Calcule a capacidade de economia a partir do histórico de transações.
    - Se a capacidade for positiva, calcule a data e preencha 'completionDate' e 'projection' ("em X meses").
    - Se a capacidade for negativa, defina 'projection' como "Capacidade de economia insuficiente para projetar.".
- **Se não houver dados de transação suficientes (menos de 15 dias de histórico, apenas no cenário 3):**
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
