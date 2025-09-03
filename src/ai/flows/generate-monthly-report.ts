
'use server';
/**
 * @fileOverview An AI flow to generate a monthly financial report.
 *
 * - generateMonthlyReport - A function that analyzes transactions for a given month and produces a structured report.
 */
import { GenerateReportInputSchema, GenerateReportOutputSchema } from '../ai-types';
import type { GenerateReportInput } from '../ai-types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { AICredential } from '@/lib/types';


const promptTemplate = `Você é um analista financeiro especializado em criar relatórios mensais claros e objetivos para usuários de um aplicativo de finanças pessoais.
Com base no JSON de transações fornecido, você deve analisar os dados do mês de {{{month}}}/{{{year}}} e gerar um relatório completo no formato JSON especificado.

Sua análise deve ser:
- **Precisa**: Calcule os totais de receitas, despesas, o balanço final e o detalhamento de gastos por categoria corretamente.
- **Perspicaz**: No resumo (campo 'summary'), vá além dos números. Comente sobre o principal ponto de gasto, ofereça um insight sobre o comportamento financeiro do usuário e forneça uma dica prática e encorajadora para o próximo mês.
- **Concisa**: Mantenha o resumo com no máximo 3 frases curtas.
- **Em Português do Brasil**: Toda a sua saída, especialmente o resumo, deve ser em Português do Brasil.

JSON de Transações:
{{{transactions}}}
`;


export async function generateMonthlyReport(input: GenerateReportInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const model = getModelReference(credential);
    
    const generateReportPrompt = configuredAI.definePrompt({
        name: 'generateMonthlyReportPrompt',
        input: {schema: GenerateReportInputSchema},
        output: {schema: GenerateReportOutputSchema},
        model: model,
        prompt: promptTemplate,
    });

    const { output } = await generateReportPrompt(input);
    if (!output) {
        throw new Error("Failed to generate monthly report.");
    }
    return output;
}
