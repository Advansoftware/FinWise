// src/components/dashboard/add-transaction-sheet.tsx
"use client";

import { useState } from "react";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";

export function AddTransactionSheet({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TransactionSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      mode="create"
    >
      {children}
    </TransactionSheet>
  );
}
