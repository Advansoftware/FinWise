'use server';
/**
 * @fileOverview An AI flow to suggest a category and subcategory for a given item name.
 *
 * - suggestCategoryForItem - A function that handles the category suggestion process.
 * - SuggestCategoryInput - The input type for the suggestCategoryForItem function.
 * - SuggestCategoryOutput - The return type for the suggestCategoryForItem function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { TransactionCategory } from '@/lib/types';

const SuggestCategoryInputSchema = z.object({
  itemName: z.string().describe('The name of the item to be categorized.'),
  existingCategories: z.array(z.string()).describe('A list of existing categories to choose from.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the item.'),
  subcategory: z.string().optional().describe('The suggested subcategory for the item (can be a new one).'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;


const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are a personal finance assistant. Your task is to categorize a spending item.
Given the item name and a list of existing categories, suggest the most appropriate category.
Also, suggest a relevant subcategory for the item. The subcategory can be new if it makes sense.

Item Name: {{{itemName}}}
Existing Categories: {{{jsonStringify existingCategories}}}

Please provide the best category and subcategory for this item.
If the item is "Conta de luz", the category should be "Contas" and subcategory "Eletricidade".
If the item is "Maçãs", the category should be "Supermercado" and subcategory "Frutas".
If the item is "Gasolina", the category should be "Transporte" and subcategory "Combustível".
`,
});

export const suggestCategoryForItem = ai.defineFlow(
  {
    name: 'suggestCategoryForItem',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
