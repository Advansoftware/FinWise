"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useBankPayment } from "@/hooks/use-bank-payment";

interface PaymentConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  amount?: number;
  description?: string;
  bankName?: string;
}

/**
 * Modal de confirmação de pagamento
 * Aparece após o usuário voltar do app do banco
 */
export function PaymentConfirmationDialog({
  open,
  onClose,
  requestId,
  amount,
  description,
  bankName,
}: PaymentConfirmationDialogProps) {
  const { markPaymentCompleted, cancelPaymentRequest } = useBankPayment();
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleConfirmPaid = async () => {
    setLoading(true);
    try {
      await markPaymentCompleted(requestId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleNotPaid = async () => {
    setLoading(true);
    try {
      await cancelPaymentRequest(requestId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 400 },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <HelpCircle size={48} style={{ color: "#3b82f6", marginBottom: 8 }} />
        <Typography variant="h6">Confirmar Pagamento</Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="body1" color="text.secondary">
            Você completou o pagamento no app do banco?
          </Typography>

          {amount && (
            <Box
              sx={{
                bgcolor: "action.hover",
                borderRadius: 2,
                p: 2,
                width: "100%",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Valor
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(amount)}
              </Typography>
              {description && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {description}
                </Typography>
              )}
              {bankName && (
                <Typography variant="caption" color="text.secondary">
                  via {bankName}
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexDirection: "column" }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          onClick={handleConfirmPaid}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} /> : <CheckCircle size={18} />
          }
          sx={{
            bgcolor: "#10b981",
            "&:hover": { bgcolor: "#059669" },
          }}
        >
          Sim, paguei!
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="large"
          onClick={handleNotPaid}
          disabled={loading}
          startIcon={<XCircle size={18} />}
        >
          Não consegui pagar
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={onClose}
          disabled={loading}
          sx={{ mt: 1 }}
        >
          Vou tentar novamente depois
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== HOOK PARA DETECTAR RETORNO DO BANCO ====================

interface PendingPayment {
  requestId: string;
  amount?: number;
  description?: string;
  bankName?: string;
  timestamp: number;
}

const PENDING_PAYMENT_KEY = "gastometria_pending_payment";
const PAYMENT_TIMEOUT = 30 * 60 * 1000; // 30 minutos

/**
 * Hook para gerenciar confirmação de pagamento
 * Detecta quando o usuário volta do app do banco
 */
export function usePaymentConfirmation() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(
    null
  );

  // Verificar se há pagamento pendente ao montar/focar
  const checkPendingPayment = useCallback(() => {
    try {
      const stored = localStorage.getItem(PENDING_PAYMENT_KEY);
      if (stored) {
        const payment: PendingPayment = JSON.parse(stored);

        // Verificar se não expirou
        if (Date.now() - payment.timestamp < PAYMENT_TIMEOUT) {
          setPendingPayment(payment);
          setShowConfirmation(true);
        } else {
          // Expirou, limpar
          localStorage.removeItem(PENDING_PAYMENT_KEY);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento pendente:", error);
    }
  }, []);

  // Salvar pagamento pendente antes de abrir banco
  const setPendingPaymentBeforeRedirect = useCallback(
    (payment: Omit<PendingPayment, "timestamp">) => {
      const paymentWithTimestamp: PendingPayment = {
        ...payment,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        PENDING_PAYMENT_KEY,
        JSON.stringify(paymentWithTimestamp)
      );
    },
    []
  );

  // Limpar pagamento pendente
  const clearPendingPayment = useCallback(() => {
    localStorage.removeItem(PENDING_PAYMENT_KEY);
    setPendingPayment(null);
    setShowConfirmation(false);
  }, []);

  // Detectar quando o app volta ao foco (usuário voltou do banco)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Pequeno delay para garantir que o app carregou
        setTimeout(checkPendingPayment, 500);
      }
    };

    const handleFocus = () => {
      setTimeout(checkPendingPayment, 500);
    };

    // Verificar ao montar
    checkPendingPayment();

    // Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkPendingPayment]);

  return {
    showConfirmation,
    pendingPayment,
    setPendingPaymentBeforeRedirect,
    clearPendingPayment,
    closeConfirmation: () => {
      clearPendingPayment();
    },
  };
}
