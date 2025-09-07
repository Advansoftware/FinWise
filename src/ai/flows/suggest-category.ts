
'use server';
/**
 * @fileOverview An AI flow to suggest a category and subcategory for a given item name.
 *
 * - suggestCategoryForItem - A function that handles the category suggestion process.
 */
import { SuggestCategoryInputSchema, SuggestCategoryOutputSchema } from '../ai-types';
import type { SuggestCategoryInput } from '../ai-types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { AICredential } from '@/lib/types';


const promptTemplate = `Você é um especialista em finanças pessoais que categoriza despesas.
Dada a descrição de uma transação (o "nome do item") e uma lista de categorias existentes, sua tarefa é sugerir a categoria e a subcategoria mais apropriadas.
A descrição da transação pode estar abreviada, como em um extrato bancário.
Toda a saída DEVE ser em Português do Brasil.

Item: {{{itemName}}}
Categorias Existentes: {{#each existingCategories}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

Exemplos:
- Item: "Pag*Conta de luz" -> Categoria: "Contas", Subcategoria: "Eletricidade"
- Item: "Compra em Supermercado P" -> Categoria: "Supermercado", Subcategoria: "Compras do mês"
- Item: "UBER TRIP HELP.UBER.COM" -> Categoria: "Transporte", Subcategoria: "Uber/99"
- Item: "IFOOD" -> Categoria: "Restaurante", Subcategoria: "Delivery"
- Item: "Spotify" -> Categoria: "Entretenimento", Subcategoria: "Streaming"
- Item: "NETFLIX" -> Categoria: "Entretenimento", Subcategoria: "Streaming"
- Item: "Gasolina Posto Shell" -> Categoria: "Transporte", Subcategoria: "Combustível"

Responda apenas com a categoria e a subcategoria mais prováveis. Se não tiver certeza da subcategoria, pode deixá-la em branco.
`;

export async function suggestCategoryForItem(input: SuggestCategoryInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const model = getModelReference(credential);

    const suggestCategoryPrompt = configuredAI.definePrompt({
        name: 'suggestCategoryPrompt',
        input: { schema: SuggestCategoryInputSchema as any },
        output: { schema: SuggestCategoryOutputSchema as any },
        model: model,
        prompt: promptTemplate,
    });

    const { output } = await suggestCategoryPrompt(input);
    if (!output) {
        throw new Error("Failed to suggest category.");
    }
    return output;
}
