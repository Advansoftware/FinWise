

export type UserPlan = 'Básico' | 'Pro' | 'Plus';

export type TransactionCategory = "Supermercado" | "Transporte" | "Entretenimento" | "Contas" | "Restaurante" | "Saúde" | "Educação" | "Lazer" | "Vestuário" | "Outros" | "Salário" | "Investimentos" | "Vendas" | "Transferência";

export type WalletType = 'Conta Corrente' | 'Cartão de Crédito' | 'Poupança' | 'Investimentos' | 'Dinheiro' | 'Outros';

export interface Wallet {
    id: string;
    name: string;
    type: WalletType;
    balance: number;
    createdAt: string; // ISO 8601 format string
}

export interface Transaction {
  id: string;
  date: string; // ISO 8601 format string
  item: string;
  category: TransactionCategory;
  subcategory?: string;
  amount: number;
  quantity?: number;
  establishment?: string;
  type: 'income' | 'expense' | 'transfer';
  walletId: string;
  toWalletId?: string; // Only for transfers
}

export interface Budget {
    id: string;
    name: string;
    category: TransactionCategory;
    amount: number;
    period: 'monthly'; // For now, only monthly budgets
    createdAt: string; // ISO 8601 format string
    currentSpending: number; // This will be calculated client-side
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    createdAt: string; // ISO 8601 format string
    monthlyDeposit?: number; // Optional monthly deposit amount
    targetDate?: string; // Optional target completion date (ISO 8601)
}


export interface Category {
  name: TransactionCategory;
  subcategories: string[];
}

export type AIProvider = 'ollama' | 'googleai' | 'openai';
export type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-vision-preview' | 'gpt-4o';

export interface AICredential {
  id: string;
  name: string; // User-defined name for the credential
  provider: AIProvider;
  ollamaModel?: string;
  ollamaServerAddress?: string;
  googleAIApiKey?: string;
  openAIModel?: OpenAIModel;
  openAIApiKey?: string;
}

// This is the shape of the entire settings object stored in Firestore
export interface AISettings {
  credentials: AICredential[];
  activeCredentialId: string | null;
}

export interface MonthlyReport {
  id: string; // YYYY-MM format
  userId: string;
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: Record<string, number>;
  summary: string; // AI-generated summary
  generatedAt: string; // ISO 8601 format string
}

export interface AnnualReport {
  id: string; // YYYY format
  userId: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  monthlyBalances: Record<string, number>; // e.g., {"1": 1200, "2": -300, ...}
  topSpendingCategories: Record<string, number>; // Top 5-10 spending categories for the year
  summary: string; // AI-generated summary of the year
  generatedAt: string; // ISO 8601 format string
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    plan: UserPlan;
    aiCredits: number;
    stripeCustomerId?: string;
    createdAt: string;
}
