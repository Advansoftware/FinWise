
'use server';
/**
 * @fileOverview An AI flow to generate a monthly financial report.
 *
 * - generateMonthlyReport - A function that analyzes transactions for a given month and produces a structured report.
 */
import { z } from 'zod';
import { GenerateReportInputSchema, GenerateReportOutputSchema } from '../ai-types';
import type { GenerateReportInput } from '../ai-types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { AICredential } from '@/lib/types';


const promptTemplate = `Você é um analista financeiro especializado em criar relatórios mensais claros e objetivos para usuários de um aplicativo de finanças pessoais.
Com base no JSON de transações do mês de {{{month}}}/{{{year}}} e, opcionalmente, no relatório do mês anterior, gere um relatório completo no formato JSON especificado.

Sua análise deve ser:
- **Precisa**: Calcule os totais de receitas, despesas, o balanço final e o detalhamento de gastos por categoria corretamente.
- **Perspicaz**: No resumo (campo 'summary'), vá além dos números. Se houver um relatório do mês anterior, compare os resultados. Comente sobre a evolução, o principal ponto de gasto do mês atual e forneça uma dica prática e encorajadora para o próximo mês.
- **Concisa**: Mantenha o resumo com no máximo 3 frases curtas.
- **Em Português do Brasil**: Toda a sua saída, especialmente o resumo, deve ser em Português do Brasil.

{{#if previousMonthReport}}
**Relatório do Mês Anterior (para contexto):**
{{{previousMonthReport}}}
{{/if}}

**JSON de Transações para o Mês Atual ({{{month}}}/{{{year}}}):**
{{{transactions}}}
`;


export async function generateMonthlyReport(input: GenerateReportInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const model = getModelReference(credential);
    
    const generateReportPrompt = configuredAI.definePrompt({
        name: 'generateMonthlyReportPrompt',
        input: {schema: GenerateReportInputSchema as z.ZodTypeAny},
        output: {schema: GenerateReportOutputSchema as z.ZodTypeAny},
        model: model,
        prompt: promptTemplate,
    });

    const { output } = await generateReportPrompt(input);
    if (!output) {
        throw new Error("Failed to generate monthly report.");
    }
    return output;
}
