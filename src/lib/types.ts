export type TransactionCategory = "Supermercado" | "Transporte" | "Entretenimento" | "Contas" | "Cerveja" | "Restaurante" | "Saúde";

export interface Transaction {
  id: string;
  date: string;
  item: string;
  category: TransactionCategory;
  amount: number;
}
