
'use server';
/**
 * @fileOverview An AI flow to extract structured information from receipt images.
 *
 * - extractReceiptInfo - A function that handles the receipt information extraction process.
 */
import {getAI} from '@/ai/genkit';
import {z} from 'genkit';
import { ReceiptInfoInputSchema, ReceiptInfoOutputSchema } from '../ai-types';


export const extractReceiptInfo = async (input: z.infer<typeof ReceiptInfoInputSchema>) => {
  const ai = await getAI();
  const prompt = ai.definePrompt({
    name: 'extractReceiptInfoPrompt',
    input: {schema: ReceiptInfoInputSchema},
    output: {schema: ReceiptInfoOutputSchema},
    prompt: `You are an expert OCR system specializing in extracting information from receipts.
You MUST reply in Brazilian Portuguese.
Analyze the provided image and extract the following information:
1. Determine if the image is a valid receipt.
2. List all individual items with their corresponding prices.
3. Find the total amount of the receipt.
4. Find the date of the receipt and format it as YYYY-MM-DD.

If the image is not a receipt, set isValid to false and leave other fields empty.

Receipt Image: {{media url=photoDataUri}}`,
  });

  const {output} = await prompt(input);
  if (!output) {
    throw new Error("Failed to extract receipt info.");
  }
  return output;
};

    