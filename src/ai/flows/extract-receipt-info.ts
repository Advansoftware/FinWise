
'use server';
/**
 * @fileOverview An AI flow to extract structured information from receipt images.
 *
 * - extractReceiptInfo - A function that handles the receipt information extraction process.
 */
import { ReceiptInfoInputSchema, ReceiptInfoOutputSchema } from '../ai-types';
import type { ReceiptInfoInput } from '../ai-types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { AICredential } from '@/lib/types';


const promptTemplate = `You are an expert OCR system specializing in extracting information from receipts.
You MUST reply in Brazilian Portuguese.
Analyze the provided image and extract the following information:
1. Determine if the image is a valid receipt.
2. List all individual items with their corresponding prices.
3. Find the total amount of the receipt.
4. Find the date of the receipt and format it as YYYY-MM-DD.

If the image is not a receipt, set isValid to false and leave other fields empty.

Receipt Image: {{media url=photoDataUri}}`;


export async function extractReceiptInfo(input: ReceiptInfoInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    // Para extração de imagem, sempre usar um modelo com capacidade de visão.
    const model = credential.provider === 'openai' ? 'openai/gpt-4-vision-preview' : 'googleai/gemini-1.5-flash-latest';

    const extractReceiptInfoPrompt = configuredAI.definePrompt({
        name: 'extractReceiptInfoPrompt',
        input: { schema: ReceiptInfoInputSchema as any },
        output: { schema: ReceiptInfoOutputSchema as any },
        model: model,
        prompt: promptTemplate,
    });

    const { output } = await extractReceiptInfoPrompt(input);
    if (!output) {
        throw new Error("Failed to extract receipt info.");
    }
    return output;
}
