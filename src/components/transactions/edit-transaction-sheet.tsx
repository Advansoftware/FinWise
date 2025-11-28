"use client";

import { Transaction } from "@/lib/types";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";

interface EditTransactionSheetProps {
  transaction: Transaction;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function EditTransactionSheet({
  transaction,
  isOpen,
  setIsOpen,
}: EditTransactionSheetProps) {
  if (!transaction) return null;

  return (
    <TransactionSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      initialData={transaction}
      mode="edit"
    />
  );
}
