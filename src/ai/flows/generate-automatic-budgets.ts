
// src/ai/flows/generate-automatic-budgets.ts
'use server';
/**
 * @fileOverview An AI flow to automatically generate a set of monthly budgets based on past spending.
 *
 * - generateAutomaticBudgets - A function that handles the automatic budget generation process.
 */
import {AICredential} from '@/lib/types';
import {createConfiguredAI, getModelReference} from '../genkit';
import {GenerateAutomaticBudgetsInput, GenerateAutomaticBudgetsInputSchema, GenerateAutomaticBudgetsOutputSchema} from '../ai-types';


const promptTemplate = `Você é um consultor financeiro pessoal que ajuda usuários a criarem seus primeiros orçamentos. Sua tarefa é analisar as transações do mês anterior e sugerir uma lista de orçamentos mensais para as principais categorias de despesa.

**Instruções:**
1.  **Analise as Transações:** Revise o JSON de transações do mês passado.
2.  **Agrupe por Categoria:** Some os gastos totais para cada categoria de despesa. Ignore categorias de receita como 'Salário', 'Vendas', 'Investimentos', etc.
3.  **Filtre Categorias Relevantes:**
    *   Foque nas 5 a 7 categorias com os maiores gastos. Não crie orçamentos para gastos muito pequenos ou irrelevantes.
    *   **Crucial**: Compare com a lista de 'existingBudgets'. **NÃO** sugira um orçamento para uma categoria que já está nessa lista.
4.  **Determine o Valor:** Para cada categoria selecionada, sugira um valor de orçamento. O valor deve ser:
    *   Um pouco desafiador, mas realista. Uma boa regra é pegar o total gasto e arredondar para um número "redondo" (múltiplo de 10 ou 50) ligeiramente abaixo do total gasto, incentivando uma pequena economia. Por exemplo, se o gasto foi R$ 834, sugira R$ 800. Se foi R$ 215, sugira R$ 200.
5.  **Dê um Nome Claro:** Crie um nome descritivo para cada orçamento, como "Gastos com Restaurantes" para a categoria "Restaurante".
6.  **Formate a Saída:** Retorne um array de objetos de orçamento no formato JSON especificado. Se nenhuma nova sugestão for aplicável (porque todos os gastos principais já têm orçamento), retorne um array vazio.

**Transações do Mês Passado:**
{{{lastMonthTransactions}}}

**Orçamentos que já existem (NÃO sugerir estas categorias):**
{{{existingBudgets}}}
`;

export async function generateAutomaticBudgets(input: GenerateAutomaticBudgetsInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const model = getModelReference(credential);

    const generateBudgetsPrompt = configuredAI.definePrompt({
        name: 'generateAutomaticBudgetsPrompt',
        input: { schema: GenerateAutomaticBudgetsInputSchema as any },
        output: { schema: GenerateAutomaticBudgetsOutputSchema as any },
        model: model,
        prompt: promptTemplate,
    });

    const { output } = await generateBudgetsPrompt(input);
    if (!output) {
        throw new Error("Failed to generate automatic budgets.");
    }
    return output;
}
