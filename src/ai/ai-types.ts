
import { z } from 'zod';

// Schema for generating spending tips
export const SpendingTipInputSchema = z.object({
  transactions: z.string().describe('A JSON string representing an array of user transactions.'),
});
export type SpendingTipInput = z.infer<typeof SpendingTipInputSchema>;

export const SpendingTipOutputSchema = z.object({
  tip: z.string().describe('A personalized, actionable spending tip.'),
});
export type SpendingTipOutput = z.infer<typeof SpendingTipOutputSchema>;


// Schema for Chat
export const MessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChatInputSchema = z.object({
    history: z.array(MessageSchema).describe('The conversation history.'),
    prompt: z.string().describe('The latest user prompt.'),
    transactions: z.array(z.any()).describe("A JSON array of the user's financial transactions."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


export const ChatOutputSchema = z.object({
    response: z.string().describe('The AI-generated response to the user.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


// Schema for extracting receipt info
export const ReceiptItemSchema = z.object({
  item: z.string().describe('The name of the purchased item.'),
  amount: z.number().describe('The price of the item.'),
});

export const ReceiptInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReceiptInfoInput = z.infer<typeof ReceiptInfoInputSchema>;

export const ReceiptInfoOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the image appears to be a valid receipt.'),
  items: z.array(ReceiptItemSchema).describe('An array of items found on the receipt.'),
  totalAmount: z.number().optional().describe('The total amount of the receipt.'),
  date: z.string().optional().describe('The date of the receipt in YYYY-MM-DD format.'),
});
export type ReceiptInfoOutput = z.infer<typeof ReceiptInfoOutputSchema>;


// Schema for suggesting categories
export const SuggestCategoryInputSchema = z.object({
  itemName: z.string().describe('The name of the item to be categorized.'),
  existingCategories: z.array(z.string()).describe('A list of existing categories to choose from.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

export const SuggestCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the item.'),
  subcategory: z.string().optional().describe('The suggested subcategory for the item (can be a new one).'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

    