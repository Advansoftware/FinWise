
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


const promptTemplate = `You are an expert OCR system specializing in extracting information from Brazilian receipts (cupons fiscais, notas fiscais).
You MUST reply in Brazilian Portuguese.
Analyze the provided image and extract the following information:

1. **isValid**: Determine if the image is a valid receipt/cupom fiscal.
2. **establishment**: Extract the store/establishment name. Look for "RAZÃO SOCIAL", store name at the top, or CNPJ description. Clean the name to be readable (e.g., "SUPERMERCADO EXTRA" not "EXTRA HIPERMERCADOS LTDA").
3. **suggestedCategory**: Based on the establishment type, suggest ONE category from this list:
   - Supermercado (for supermarkets, grocery stores)
   - Alimentação (for restaurants, fast food, bakeries, cafés)
   - Transporte (for gas stations, parking, toll)
   - Saúde (for pharmacies, hospitals, clinics)
   - Vestuário (for clothing stores)
   - Beleza (for beauty salons, cosmetics stores)
   - Lazer (for entertainment, movies, games)
   - Educação (for bookstores, courses)
   - Outros (for anything else)
4. **items**: List ALL individual items with their names and prices. Format item names clearly (e.g., "Arroz 5kg" not "ARROZ TP1 5KG").
5. **totalAmount**: Find the TOTAL value (look for "TOTAL", "VALOR TOTAL", "TOTAL A PAGAR").
6. **date**: Find the date and format as YYYY-MM-DD.

If the image is not a receipt, set isValid to false and leave other fields empty.

Receipt Image: {{media url=photoDataUri}}`;


export async function extractReceiptInfo(input: ReceiptInfoInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    // Para extração de imagem, sempre usar um modelo com capacidade de visão.
    // gpt-4o e gpt-4o-mini suportam visão. O antigo gpt-4-vision-preview foi descontinuado.
    let model: string;
    if (credential.provider === 'openai') {
        // Usar gpt-4o para melhor qualidade em OCR de notas fiscais
        model = 'openai/gpt-4o';
    } else if (credential.provider === 'googleai') {
        model = 'googleai/gemini-1.5-flash-latest';
    } else {
        // Fallback para outros providers
        model = 'openai/gpt-4o';
    }

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
