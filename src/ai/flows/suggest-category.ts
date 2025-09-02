
'use server';
/**
 * @fileOverview An AI flow to suggest a category and subcategory for a given item name.
 *
 * - suggestCategoryForItem - A function that handles the category suggestion process.
 */
import {getAI} from '@/ai/genkit';
import {z} from 'genkit';
import { SuggestCategoryInputSchema, SuggestCategoryOutputSchema } from '../ai-types';


export const suggestCategoryForItem = async (input: z.infer<typeof SuggestCategoryInputSchema>) => {
  const ai = await getAI();
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

  const {output} = await prompt(input);
  if (!output) {
    throw new Error("Failed to suggest category.");
  }
  return output;
};

    