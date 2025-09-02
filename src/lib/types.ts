export type TransactionCategory = "Supermercado" | "Transporte" | "Entretenimento" | "Contas" | "Restaurante" | "Saúde";

export interface Transaction {
  id: string;
  date: string; // ISO 8601 format string
  item: string;
  category: TransactionCategory;
  subcategory?: string;
  amount: number;
  quantity?: number;
}

export interface Category {
  name: TransactionCategory;
  subcategories: string[];
}

export type AIProvider = 'ollama' | 'googleai' | 'openai';
export type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4';

export interface AISettings {
  provider: AIProvider;
  ollamaModel?: string;
  ollamaServerAddress?: string;
  googleAIApiKey?: string;
  openAIModel?: OpenAIModel;
  openAIApiKey?: string;
}
