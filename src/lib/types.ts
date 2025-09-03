export type TransactionCategory = "Supermercado" | "Transporte" | "Entretenimento" | "Contas" | "Restaurante" | "Saúde" | "Educação" | "Lazer" | "Vestuário" | "Outros" | "Salário" | "Investimentos" | "Vendas";

export interface Transaction {
  id: string;
  date: string; // ISO 8601 format string
  item: string;
  category: TransactionCategory;
  subcategory?: string;
  amount: number;
  quantity?: number;
  establishment?: string;
  type: 'income' | 'expense';
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
