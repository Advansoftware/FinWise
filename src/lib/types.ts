export type TransactionCategory = "Supermercado" | "Transporte" | "Entretenimento" | "Contas" | "Restaurante" | "Saúde";

export interface Transaction {
  id: string;
  date: string;
  item: string;
  category: TransactionCategory;
  subcategory?: string;
  amount: number;
}

export interface Category {
  name: TransactionCategory;
  subcategories: string[];
}
