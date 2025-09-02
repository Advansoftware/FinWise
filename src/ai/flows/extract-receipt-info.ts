'use server';
/**
 * @fileOverview An AI flow to extract structured information from receipt images.
 *
 * - extractReceiptInfo - A function that handles the receipt information extraction process.
 * - ReceiptInfoInput - The input type for the extractReceiptInfo function.
 * - ReceiptInfoOutput - The return type for the extractReceiptInfo function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReceiptItemSchema = z.object({
  item: z.string().describe('The name of the purchased item.'),
  amount: z.number().describe('The price of the item.'),
});

const ReceiptInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReceiptInfoInput = z.infer<typeof ReceiptInfoInputSchema>;

const ReceiptInfoOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the image appears to be a valid receipt.'),
  items: z.array(ReceiptItemSchema).describe('An array of items found on the receipt.'),
  totalAmount: z.number().optional().describe('The total amount of the receipt.'),
  date: z.string().optional().describe('The date of the receipt in YYYY-MM-DD format.'),
});
export type ReceiptInfoOutput = z.infer<typeof ReceiptInfoOutputSchema>;


const prompt = ai.definePrompt({
  name: 'extractReceiptInfoPrompt',
  input: {schema: ReceiptInfoInputSchema},
  output: {schema: ReceiptInfoOutputSchema},
  prompt: `You are an expert OCR system specializing in extracting information from receipts.
Analyze the provided image and extract the following information:
1. Determine if the image is a valid receipt.
2. List all individual items with their corresponding prices.
3. Find the total amount of the receipt.
4. Find the date of the receipt and format it as YYYY-MM-DD.

If the image is not a receipt, set isValid to false and leave other fields empty.

Receipt Image: {{media url=photoDataUri}}`,
});

export const extractReceiptInfo = ai.defineFlow(
  {
    name: 'extractReceiptInfo',
    inputSchema: ReceiptInfoInputSchema,
    outputSchema: ReceiptInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
