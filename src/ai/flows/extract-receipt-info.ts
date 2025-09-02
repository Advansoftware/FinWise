'use server';
/**
 * @fileOverview An AI flow to extract structured information from receipt images.
 *
 * - extractReceiptInfo - A function that handles the receipt information extraction process.
 * - ReceiptInfoInput - The input type for the extractReceiptInfo function.
 * - ReceiptInfoOutput - The return type for the extractReceiptInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ReceiptInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReceiptInfoInput = z.infer<typeof ReceiptInfoInputSchema>;

const ReceiptItemSchema = z.object({
    item: z.string().describe('The name or description of the purchased item.'),
    amount: z.number().describe('The price of the item.')
});

const ReceiptInfoOutputSchema = z.object({
    isValid: z.boolean().describe('Whether the image appears to be a valid receipt or fiscal note.'),
    items: z.array(ReceiptItemSchema).optional().describe('An array of items found on the receipt.'),
    totalAmount: z.number().optional().describe('The total amount of the transaction.'),
    date: z.string().optional().describe('The date of the transaction in YYYY-MM-DD format.'),
});
export type ReceiptInfoOutput = z.infer<typeof ReceiptInfoOutputSchema>;

export async function extractReceiptInfo(input: ReceiptInfoInput): Promise<ReceiptInfoOutput> {
  return extractReceiptInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractReceiptInfoPrompt',
  input: {schema: ReceiptInfoInputSchema},
  output: {schema: ReceiptInfoOutputSchema},
  prompt: `Você é um especialista em processamento de documentos e sua tarefa é extrair informações de notas fiscais ou cupons fiscais brasileiros.

Analise a imagem fornecida. Primeiro, determine se a imagem é uma nota fiscal ou cupom fiscal válido.

Se for válido, extraia as seguintes informações:
1.  **Itens**: Uma lista de todos os itens comprados, com sua descrição e valor individual.
2.  **Valor Total**: O valor total da compra.
3.  **Data**: A data em que a compra foi realizada, no formato AAAA-MM-DD.

Se a imagem não for uma nota fiscal ou cupom fiscal, ou se não for legível, retorne 'isValid' como falso e deixe os outros campos em branco.

Imagem da Nota Fiscal: {{media url=photoDataUri}}`,
});

const extractReceiptInfoFlow = ai.defineFlow(
  {
    name: 'extractReceiptInfoFlow',
    inputSchema: ReceiptInfoInputSchema,
    outputSchema: ReceiptInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
