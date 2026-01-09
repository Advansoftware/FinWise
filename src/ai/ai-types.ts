// src/ai/ai-types.ts

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
  gamificationData: z.string().optional().describe('A JSON string representing the user gamification profile including points, level, badges, achievements, streak, and completion rates.'),
});
export type FinancialProfileInput = z.infer<typeof FinancialProfileInputSchema>;

export const FinancialProfileOutputSchema = z.object({
  profileName: z.string().describe('A creative, catchy name for the user financial profile, in Brazilian Portuguese. For example: "O Estrategista Cauteloso", "O Explorador de Sabores", "O Acumulador de Metas".'),
  profileDescription: z.string().describe('A comprehensive, encouraging, and insightful description of the user spending habits that justifies the profileName, in Brazilian Portuguese. Should include insights about their gamification achievements, discipline level, and payment consistency.'),
  gamificationInfluence: z.object({
    disciplineLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado', 'Expert']).describe('User discipline level based on gamification data'),
    paymentConsistency: z.enum(['Irregular', 'Regular', 'Muito Regular', 'Exemplar']).describe('Payment consistency based on streak and completion rates'),
    strengthsFromGamification: z.array(z.string()).describe('Financial strengths derived from gamification achievements'),
    improvementAreas: z.array(z.string()).describe('Areas for improvement based on gamification metrics')
  }).optional().describe('Gamification-influenced profile insights'),
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
  establishment: z.string().optional().describe('The name of the store/establishment where the purchase was made (e.g., "Supermercado Extra", "Farmácia São João").'),
  suggestedCategory: z.string().optional().describe('The suggested category for this receipt based on the establishment type. Must be one of: Alimentação, Supermercado, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Beleza, Assinaturas, Investimentos, Presentes, Viagem, Animais, Outros.'),
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
  transactions: z.string().describe('A JSON string representing an array of transactions for the report month.'),
  month: z.string().describe('The month for the report in "MM" format.'),
  year: z.string().describe('The year for the report in "YYYY" format.'),
  previousMonthReport: z.string().optional().describe("An optional JSON string of the previous month's report to provide context and track progression."),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

export const GenerateReportOutputSchema = z.object({
  totalIncome: z.number().describe('The total income for the month.'),
  totalExpense: z.number().describe('The total expense for the month.'),
  balance: z.number().describe('The final balance for the month (income - expense).'),
  categoryBreakdown: z.record(z.string(), z.number()).describe('An object with spending totals for each category.'),
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
  monthlyBalances: z.record(z.string(), z.number()).describe('An object with the final balance for each month of the year (key: month number 1-12).'),
  topSpendingCategories: z.record(z.string(), z.number()).describe('An object with the top 5 spending categories and their total amounts for the year.'),
  summary: z.string().describe('A concise, insightful, and encouraging summary of the year financial activity in Brazilian Portuguese. Highlight overall trends, the main spending category of the year, and suggest one high-level goal for the next year.'),
});
export type GenerateAnnualReportOutput = z.infer<typeof GenerateAnnualReportOutputSchema>;

// Schema for Budget Suggestion
export const SuggestBudgetInputSchema = z.object({
  category: z.string().describe('The category for which to suggest a budget.'),
  transactions: z.string().describe('A JSON string of transactions from the previous month for that category.'),
});
export type SuggestBudgetInput = z.infer<typeof SuggestBudgetInputSchema>;

export const SuggestBudgetOutputSchema = z.object({
  suggestedAmount: z.number().describe('The suggested budget amount, rounded to a sensible whole number.'),
  justification: z.string().describe('A brief, one-sentence justification for the suggested amount in Brazilian Portuguese.'),
});
export type SuggestBudgetOutput = z.infer<typeof SuggestBudgetOutputSchema>;


// Schema for Goal Projection
export const ProjectGoalCompletionInputSchema = z.object({
  goalName: z.string().describe('The name of the goal.'),
  targetAmount: z.number().describe('The target amount for the goal.'),
  currentAmount: z.number().describe('The current saved amount for the goal.'),
  monthlyDeposit: z.number().optional().describe('An optional monthly deposit amount the user plans to make.'),
  targetDate: z.string().optional().describe('An optional target date (ISO 8601 format) the user wants to achieve the goal by.'),
  transactions: z.string().describe('A JSON string of all user transactions to analyze their saving capacity if no other info is provided.'),
});
export type ProjectGoalCompletionInput = z.infer<typeof ProjectGoalCompletionInputSchema>;

export const ProjectGoalCompletionOutputSchema = z.object({
  completionDate: z.string().optional().describe('The projected completion date in YYYY-MM-DD format. Only set if a projection is possible.'),
  projection: z.string().describe('A human-readable projection in Brazilian Portuguese (e.g., "em 5 meses", "dados insuficientes", "você precisa economizar R$X por mês").'),
  requiredMonthlyDeposit: z.number().optional().describe('The calculated monthly deposit required to meet the targetDate, if provided.'),
});
export type ProjectGoalCompletionOutput = z.infer<typeof ProjectGoalCompletionOutputSchema>;

// Schema for Automatic Budgets
export const GenerateAutomaticBudgetsInputSchema = z.object({
  lastMonthTransactions: z.string().describe('A JSON string of all transactions from the previous month.'),
  existingBudgets: z.string().describe('A JSON string of already existing budget categories for the current month.'),
});
export type GenerateAutomaticBudgetsInput = z.infer<typeof GenerateAutomaticBudgetsInputSchema>;

export const BudgetItemSchema = z.object({
  name: z.string().describe('A clear name for the budget (e.g., "Gastos com Supermercado").'),
  category: z.string().describe('The category this budget applies to.'),
  amount: z.number().describe('The suggested budget amount, rounded to a sensible whole number (e.g., multiple of 10 or 50).'),
});

export const GenerateAutomaticBudgetsOutputSchema = z.object({
  suggestedBudgets: z.array(BudgetItemSchema).describe('An array of suggested budgets.'),
});
export type GenerateAutomaticBudgetsOutput = z.infer<typeof GenerateAutomaticBudgetsOutputSchema>;

// Schema for Future Balance Prediction
export const PredictFutureBalanceInputSchema = z.object({
  last3MonthsTransactions: z.string().describe('A JSON string of all transactions from the previous 3 months to analyze spending patterns.'),
  currentBalance: z.number().describe('The user current consolidated balance across all wallets.'),
  recurringBills: z.string().describe('A JSON string of known recurring bills for the current month (from budgets).'),
});
export type PredictFutureBalanceInput = z.infer<typeof PredictFutureBalanceInputSchema>;

export const PredictFutureBalanceOutputSchema = z.object({
  projectedEndOfMonthBalance: z.number().describe('The projected final balance for the end of the current month.'),
  isRiskOfNegativeBalance: z.boolean().describe('Whether there is a significant risk of the balance going negative this month.'),
  summary: z.string().describe('A very brief, one-sentence summary of the projection in Brazilian Portuguese (e.g., "Você está a caminho de terminar o mês positivo!" ou "Atenção! Seu saldo pode ficar negativo se os gastos continuarem neste ritmo.").'),
});
export type PredictFutureBalanceOutput = z.infer<typeof PredictFutureBalanceOutputSchema>;

// Schema for AI Credit Log
export type AICreditLogAction =
  | 'Dica Rápida'
  | 'Perfil Financeiro'
  | 'Análise de Transações'
  | 'Chat com Assistente'
  | 'Leitura de Nota Fiscal (OCR)'
  | 'Sugestão de Categoria'
  | 'Relatório Mensal'
  | 'Relatório Anual'
  | 'Sugestão de Orçamento'
  | 'Projeção de Meta'
  | 'Criação de Orçamentos Automáticos'
  | 'Previsão de Saldo'
  | 'WhatsApp - Mensagem com IA'
  | 'WhatsApp - Imagem/OCR'
  | 'WhatsApp - Áudio Transcrito'
  | 'WhatsApp - Categorização';

export const AICreditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(), // Corresponds to AICreditLogAction
  cost: z.number(),
  timestamp: z.string(), // ISO 8601 string
});
export type AICreditLog = z.infer<typeof AICreditLogSchema>;
