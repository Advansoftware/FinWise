
'use server';
/**
 * @fileOverview An AI flow to generate an annual financial report from monthly summaries.
 *
 * - generateAnnualReport - A function that analyzes 12 monthly reports and produces a structured annual report.
 */
import { GenerateAnnualReportInputSchema, GenerateAnnualReportOutputSchema } from '../ai-types';
import type { GenerateAnnualReportInput } from '../ai-types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { AICredential } from '@/lib/types';


const promptTemplate = `Você é um consultor financeiro sênior, encarregado de compilar e analisar os relatórios financeiros mensais de um cliente para criar um relatório anual abrangente.
Com base no JSON de 12 relatórios mensais fornecido, você deve analisar os dados do ano de {{{year}}} e gerar um relatório anual completo no formato JSON especificado.

Sua análise deve ser:
- **Precisa**: Calcule os totais anuais de receitas e despesas, o balanço final, os balanços de cada mês e as 5 principais categorias de despesa do ano.
- **Estratégica**: No resumo (campo 'summary'), ofereça uma visão macro da saúde financeira do ano. Comente sobre a evolução do balanço ao longo dos meses, identifique a principal área de gastos e forneça uma ou duas metas financeiras de alto nível e alcançáveis para o próximo ano.
- **Concisa**: Mantenha o resumo com no máximo 4 frases.
- **Em Português do Brasil**: Toda a sua saída, especialmente o resumo, deve ser em Português do Brasil.

JSON dos Relatórios Mensais:
{{{monthlyReports}}}
`;


export async function generateAnnualReport(input: GenerateAnnualReportInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const model = getModelReference(credential);
    
    const generateReportPrompt = configuredAI.definePrompt({
        name: 'generateAnnualReportPrompt',
        input: {schema: GenerateAnnualReportInputSchema},
        output: {schema: GenerateAnnualReportOutputSchema},
        model: model,
        prompt: promptTemplate,
    });

    const { output } = await generateReportPrompt(input);
    if (!output) {
        throw new Error("Failed to generate annual report.");
    }
    return output;
}

