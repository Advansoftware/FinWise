// src/ai/flows/predict-future-balance.ts
'use server';
/**
 * @fileOverview An AI flow to predict the user's end-of-month balance.
 *
 * - predictFutureBalance - A function that handles the future balance prediction process.
 */
import { type ZodTypeAny } from 'zod';
import { AICredential } from '@/lib/types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { PredictFutureBalanceInput, PredictFutureBalanceInputSchema, PredictFutureBalanceOutputSchema } from '../ai-types';


const promptTemplate = `Você é um analista financeiro preditivo. Sua tarefa é prever o saldo de um usuário no final do mês corrente com base em seu histórico de gastos, saldo atual e contas recorrentes conhecidas.

**Contexto:**
- **Hoje é dia**: {currentDayOfMonth}
- **Dias restantes no mês**: {daysRemainingInMonth}
- **Saldo Atual Consolidado**: R$ {currentBalance}

**Dados para Análise:**
1.  **Transações dos Últimos 3 Meses:** Use este JSON para calcular uma média de gastos diários em categorias "não essenciais" (como Restaurante, Lazer, Compras). Ignore grandes transações pontuais.
    \`\`\`json
    {{{last3MonthsTransactions}}}
    \`\`\`

2.  **Contas Recorrentes (Orçamentos):** Este JSON representa as contas fixas que o usuário provavelmente ainda precisa pagar este mês.
    \`\`\`json
    {{{recurringBills}}}
    \`\`\`

**Lógica de Cálculo:**
1.  **Calcule a Média de Gastos Diários Variáveis**: Com base nas transações dos últimos 3 meses, estime quanto o usuário gasta por dia em despesas não fixas (Lazer, Restaurante, Supermercado, etc.).
2.  **Projete os Gastos Variáveis Futuros**: Multiplique a média de gastos diários pelo número de dias restantes no mês.
3.  **Some as Contas Fixas Pendentes**: Some o valor total das contas recorrentes listadas em \`recurringBills\`.
4.  **Calcule o Total de Despesas Projetadas**: Some os gastos variáveis futuros com as contas fixas pendentes.
5.  **Calcule o Saldo Projetado no Final do Mês**: Subtraia o Total de Despesas Projetadas do Saldo Atual.
6.  **Analise o Risco**: Determine se o saldo projetado é negativo ou perigosamente baixo (per Perto de zero). Se for, marque \`isRiskOfNegativeBalance\` como \`true\`.
7.  **Crie um Resumo Conciso**: Escreva uma única frase, em Português do Brasil, resumindo a previsão.

Seja pragmático e baseie sua análise nos dados fornecidos.
`;


export async function predictFutureBalance(input: PredictFutureBalanceInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const model = getModelReference(credential);
    
    // Enrich the prompt with current date context
    const now = new Date();
    const currentDayOfMonth = now.getDate();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemainingInMonth = lastDayOfMonth - currentDayOfMonth;

    const finalPrompt = promptTemplate
      .replace('{currentDayOfMonth}', String(currentDayOfMonth))
      .replace('{daysRemainingInMonth}', String(daysRemainingInMonth))
      .replace('{currentBalance}', String(input.currentBalance));

    const predictBalancePrompt = configuredAI.definePrompt({
        name: 'predictFutureBalancePrompt',
        input: {schema: PredictFutureBalanceInputSchema as unknown as ZodTypeAny},
        output: {schema: PredictFutureBalanceOutputSchema as unknown as ZodTypeAny},
        model: model,
        prompt: finalPrompt,
    });

    const { output } = await predictBalancePrompt(input);
    if (!output) {
        throw new Error("Failed to predict future balance.");
    }
    return output;
}
