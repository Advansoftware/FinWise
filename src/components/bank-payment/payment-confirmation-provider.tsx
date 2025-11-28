"use client";

import {
  usePaymentConfirmation,
  PaymentConfirmationDialog,
} from "@/components/bank-payment/payment-confirmation-dialog";

/**
 * Componente global que monitora retorno do app do banco
 * Deve ser incluído no layout para funcionar em todas as páginas
 */
export function PaymentConfirmationProvider() {
  const { showConfirmation, pendingPayment, closeConfirmation } =
    usePaymentConfirmation();

  if (!showConfirmation || !pendingPayment) {
    return null;
  }

  return (
    <PaymentConfirmationDialog
      open={showConfirmation}
      onClose={closeConfirmation}
      requestId={pendingPayment.requestId}
      amount={pendingPayment.amount}
      description={pendingPayment.description}
      bankName={pendingPayment.bankName}
    />
  );
}
