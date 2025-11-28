"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Box,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { SupportedBank } from "@/core/ports/bank-payment.port";
import { usePaymentConfirmation } from "./payment-confirmation-dialog";

interface PaymentButtonProps {
  amount: number;
  description?: string;
  receiverName?: string;
  receiverPixKey?: string;
  bank?: SupportedBank;
  installmentId?: string;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaymentButton({
  amount,
  description,
  receiverName,
  receiverPixKey,
  bank = "nubank",
  installmentId,
  variant = "contained",
  size = "medium",
  fullWidth = false,
  disabled = false,
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const {
    initiatePayment,
    isMobile,
    hasMobileDevice,
    hasMobileDeviceWithPush,
    loading,
  } = useBankPayment();
  const { setPendingPaymentBeforeRedirect } = usePaymentConfirmation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushSent, setPushSent] = useState(false);

  // Formatação de valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Obter cor do banco
  const getBankColor = (bankName: string) => {
    const colors: Record<string, string> = {
      nubank: "#820AD1",
      itau: "#FF6600",
      bradesco: "#CC092F",
      santander: "#EC0000",
      inter: "#FF7A00",
      c6: "#1A1A1A",
      picpay: "#21C25E",
      mercadopago: "#00A8E8",
    };
    return colors[bankName] || "#1976d2";
  };

  // Handler do botão de pagamento
  const handlePayClick = () => {
    // Se estiver no mobile, não precisa de confirmação
    if (isMobile) {
      handlePay();
    } else {
      // No desktop, mostrar diálogo de confirmação
      setDialogOpen(true);
    }
  };

  // Processar pagamento
  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    setPushSent(false);

    try {
      const result = await initiatePayment({
        amount,
        description,
        receiverName,
        receiverPixKey,
        bank,
        installmentId,
      });

      if (isMobile) {
        // No mobile, o deep link foi aberto
        if (result.deepLinkOpened) {
          // Salvar pagamento pendente para confirmação ao retornar
          if (result.requestId) {
            setPendingPaymentBeforeRedirect({
              requestId: result.requestId,
              amount,
              description,
              bankName: bank.toUpperCase(),
            });
          }
          onSuccess?.();
          setDialogOpen(false);
        } else if (result.fallbackUrl) {
          // Salvar pagamento pendente antes de abrir fallback
          if (result.requestId) {
            setPendingPaymentBeforeRedirect({
              requestId: result.requestId,
              amount,
              description,
              bankName: bank.toUpperCase(),
            });
          }
          window.open(result.fallbackUrl, "_blank");
          onSuccess?.();
          setDialogOpen(false);
        } else {
          setError("Não foi possível abrir o aplicativo do banco");
          onError?.("Não foi possível abrir o aplicativo do banco");
        }
      } else {
        // No desktop, push foi enviado
        if (result.pushSent) {
          setPushSent(true);
          onSuccess?.();
        } else {
          setError(
            "Não foi possível enviar a notificação. Verifique se você tem um dispositivo móvel cadastrado."
          );
          onError?.("Falha ao enviar notificação");
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || "Erro ao processar pagamento";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // Fechar diálogo
  const handleClose = () => {
    setDialogOpen(false);
    setError(null);
    setPushSent(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        onClick={handlePayClick}
        startIcon={loading ? <CircularProgress size={16} /> : <PaymentIcon />}
        sx={{
          bgcolor: variant === "contained" ? getBankColor(bank) : undefined,
          borderColor: variant === "outlined" ? getBankColor(bank) : undefined,
          color: variant === "contained" ? "white" : getBankColor(bank),
          "&:hover": {
            bgcolor:
              variant === "contained"
                ? getBankColor(bank)
                : `${getBankColor(bank)}10`,
            filter: variant === "contained" ? "brightness(0.9)" : undefined,
            borderColor:
              variant === "outlined" ? getBankColor(bank) : undefined,
          },
        }}
      >
        Pagar
      </Button>

      {/* Diálogo de confirmação (apenas desktop) */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <PaymentIcon sx={{ color: getBankColor(bank) }} />
            <Typography variant="h6">Confirmar Pagamento</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Informações do pagamento */}
            <Box textAlign="center" py={2}>
              <Typography variant="caption" color="text.secondary">
                Valor a pagar
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ color: getBankColor(bank) }}
              >
                {formatCurrency(amount)}
              </Typography>
              {receiverName && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Para: {receiverName}
                </Typography>
              )}
              {description && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>

            {/* Indicador de fluxo */}
            <Box
              sx={{
                bgcolor: "grey.100",
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={2}
              >
                <ComputerIcon color="action" />
                <SendIcon sx={{ color: "primary.main" }} />
                <SmartphoneIcon sx={{ color: getBankColor(bank) }} />
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                textAlign="center"
                display="block"
                mt={1}
              >
                Uma notificação será enviada para seu celular
              </Typography>
            </Box>

            {/* Banco selecionado */}
            <Box textAlign="center">
              <Chip
                label={bank.toUpperCase()}
                sx={{
                  bgcolor: getBankColor(bank),
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Box>

            {/* Mensagem de sucesso */}
            {pushSent && (
              <Alert severity="success">
                Notificação enviada! Verifique seu celular para completar o
                pagamento.
              </Alert>
            )}

            {/* Mensagem de erro */}
            {error && <Alert severity="error">{error}</Alert>}

            {/* Aviso se não houver dispositivo móvel com push */}
            {!isMobile && !hasMobileDeviceWithPush && !pushSent && (
              <Alert severity="warning">
                {hasMobileDevice
                  ? "Seu dispositivo móvel não tem notificações push ativadas. Ative nas configurações para receber alertas de pagamento."
                  : "Você não tem um dispositivo móvel cadastrado. Cadastre nas configurações para receber notificações de pagamento."}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleClose} disabled={processing}>
            {pushSent ? "Fechar" : "Cancelar"}
          </Button>
          {!pushSent && (
            <Button
              variant="contained"
              onClick={handlePay}
              disabled={processing || (!isMobile && !hasMobileDeviceWithPush)}
              startIcon={
                processing ? <CircularProgress size={16} /> : <SendIcon />
              }
              sx={{
                bgcolor: getBankColor(bank),
                "&:hover": {
                  bgcolor: getBankColor(bank),
                  filter: "brightness(0.9)",
                },
              }}
            >
              {processing ? "Enviando..." : "Enviar para Celular"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
