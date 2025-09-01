export type TransactionCategory = "Groceries" | "Transport" | "Entertainment" | "Utilities" | "Beer" | "Dining" | "Health";

export interface Transaction {
  id: string;
  date: string;
  item: string;
  category: TransactionCategory;
  amount: number;
}
