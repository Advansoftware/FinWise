
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

// Schema for Financial Profile
export const FinancialProfileInputSchema = z.object({
  currentMonthTransactions: z.string().describe("A JSON string representing the user's transactions for the current, ongoing month."),
  monthlyReports: z.string().describe('A JSON string representing an array of pre-computed monthly financial summary reports from the current year.'),
  annualReports: z.string().describe('A JSON string representing an array of pre-computed annual financial summary reports from past years.'),
});
export type FinancialProfileInput = z.infer<typeof FinancialProfileInputSchema>;

export const FinancialProfileOutputSchema = z.object({
  profileName: z.string().describe('A creative, catchy name for the user financial profile, in Brazilian Portuguese.'),
  profileDescription: z.string().describe('A short, encouraging, and insightful description of the user spending habits, in Brazilian Portuguese.'),
});
export type FinancialProfileOutput = z.infer<typeof FinancialProfileOutputSchema>;

// Schema for Transaction Analysis
export const AnalyzeTransactionsInputSchema = z.object({
  txns: z.string().describe('A JSON string representing an array of transactions to analyze.'),
});
export type AnalyzeTransactionsInput = z.infer<typeof AnalyzeTransactionsInputSchema>;

export const AnalyzeTransactionsOutputSchema = z.object({
  analysis: z.string().describe('A brief, insightful analysis of the provided transactions in Brazilian Portuguese.'),
});
export type AnalyzeTransactionsOutput = z.infer<typeof AnalyzeTransactionsOutputSchema>;

// Schema for Chat
export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe('The latest user prompt.'),
  transactions: z.array(z.any()).describe("A JSON array of the user's financial transactions for the CURRENT month only."),
  monthlyReports: z.array(z.any()).optional().describe("An optional JSON array of pre-computed monthly financial reports FOR THE CURRENT YEAR. Use this for questions about past months within this year."),
  annualReports: z.array(z.any()).optional().describe("An optional JSON array of pre-computed ANNUAL reports. Use this for questions about previous years to get quick, summarized data."),
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
  photoDataUri: z.string().describe('A photo of a receipt as a data URI.'),
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
  subcategory: z.string().optional().describe('The suggested subcategory for the item.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;


// Schema for Monthly Report
export const GenerateReportInputSchema = z.object({
  transactions: z.string().describe('A JSON string representing an array of transactions for a specific month.'),
  month: z.string().describe('The month for the report in "MM" format.'),
  year: z.string().describe('The year for the report in "YYYY" format.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

export const GenerateReportOutputSchema = z.object({
  totalIncome: z.number().describe('The total income for the month.'),
  totalExpense: z.number().describe('The total expense for the month.'),
  balance: z.number().describe('The final balance for the month (income - expense).'),
  categoryBreakdown: z.record(z.number()).describe('An object with spending totals for each category.'),
  summary: z.string().describe('A concise, insightful, and encouraging summary of the month financial activity in Brazilian Portuguese. Highlight the main spending category and suggest one area for improvement.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

// Schema for Annual Report
export const GenerateAnnualReportInputSchema = z.object({
  monthlyReports: z.string().describe('A JSON string representing an array of all 12 monthly reports for the year.'),
  year: z.string().describe('The year for the report in "YYYY" format.'),
});
export type GenerateAnnualReportInput = z.infer<typeof GenerateAnnualReportInputSchema>;

export const GenerateAnnualReportOutputSchema = z.object({
  totalIncome: z.number().describe('The total income for the year.'),
  totalExpense: z.number().describe('The total expense for the year.'),
  finalBalance: z.number().describe('The final balance for the year (income - expense).'),
  monthlyBalances: z.record(z.number()).describe('An object with the final balance for each month of the year (key: month number 1-12).'),
  topSpendingCategories: z.record(z.number()).describe('An object with the top 5 spending categories and their total amounts for the year.'),
  summary: z.string().describe('A concise, insightful, and encouraging summary of the year financial activity in Brazilian Portuguese. Highlight overall trends, the main spending category of the year, and suggest one high-level goal for the next year.'),
});
export type GenerateAnnualReportOutput = z.infer<typeof GenerateAnnualReportOutputSchema>;
