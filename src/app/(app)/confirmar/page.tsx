"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Payment as PaymentIcon,
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { PaymentRequest } from "@/core/ports/bank-payment.port";

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    processPayment,
    getPaymentRequest,
    loading: hookLoading,
  } = useBankPayment();

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deepLinkOpened, setDeepLinkOpened] = useState(false);

  const paymentId = searchParams.get("id");

  // Buscar dados da solicitação
  const fetchPaymentRequest = useCallback(async () => {
    if (!paymentId) {
      setError("ID de pagamento não fornecido");
      setLoading(false);
      return;
    }

    try {
      const request = await getPaymentRequest(paymentId);
      if (!request) {
        setError("Solicitação de pagamento não encontrada");
      } else if (request.status === "completed") {
        setSuccess(true);
      } else if (
        request.status === "cancelled" ||
        request.status === "expired"
      ) {
        setError(
          `Esta solicitação foi ${
            request.status === "cancelled" ? "cancelada" : "expirada"
          }`
        );
      }
      setPaymentRequest(request);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar solicitação");
    } finally {
      setLoading(false);
    }
  }, [paymentId, getPaymentRequest]);

  useEffect(() => {
    fetchPaymentRequest();
  }, [fetchPaymentRequest]);

  // Processar pagamento
  const handlePay = async () => {
    if (!paymentRequest) return;

    setProcessing(true);
    setError(null);

    try {
      const result = await processPayment(paymentRequest.id);

      if (result.deepLinkOpened) {
        setDeepLinkOpened(true);
        // Aguardar um momento antes de marcar como sucesso
        setTimeout(() => {
          setSuccess(true);
          setProcessing(false);
        }, 2000);
      } else if (result.fallbackUrl) {
        // Abrir URL de fallback
        window.open(result.fallbackUrl, "_blank");
        setDeepLinkOpened(true);
        setTimeout(() => {
          setSuccess(true);
          setProcessing(false);
        }, 2000);
      } else {
        setError("Não foi possível abrir o aplicativo do banco");
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento");
      setProcessing(false);
    }
  };

  // Cancelar e voltar
  const handleCancel = () => {
    router.push("/installments");
  };

  // Formatação de valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obter cor do banco
  const getBankColor = (bank?: string) => {
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
    return colors[bank || ""] || "#1976d2";
  };

  // Loading state
  if (loading || hookLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error && !paymentRequest) {
    return (
      <Box sx={{ minHeight: "100vh", p: 2 }}>
        <Card sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
          <CardContent>
            <Stack spacing={3} alignItems="center">
              <ErrorIcon sx={{ fontSize: 64, color: "error.main" }} />
              <Typography variant="h6" textAlign="center">
                {error}
              </Typography>
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push("/installments")}
              >
                Voltar
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Success state
  if (success) {
    return (
      <Box sx={{ minHeight: "100vh", p: 2 }}>
        <Card sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
          <CardContent>
            <Stack spacing={3} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 80, color: "success.main" }} />
              <Typography variant="h5" textAlign="center" fontWeight="bold">
                {deepLinkOpened
                  ? "Aplicativo do banco aberto!"
                  : "Pagamento concluído!"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {deepLinkOpened
                  ? "Complete o pagamento no aplicativo do seu banco."
                  : "Seu pagamento foi processado com sucesso."}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push("/installments")}
                fullWidth
              >
                Voltar para Parcelas
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Main content
  return (
    <Box sx={{ minHeight: "100vh", p: 2 }}>
      <Card sx={{ maxWidth: 450, mx: "auto", mt: 2 }}>
        <Box
          sx={{
            bgcolor: getBankColor(paymentRequest?.paymentData?.bank),
            color: "white",
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            sx={{ color: "white" }}
            onClick={handleCancel}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <PaymentIcon />
          <Typography variant="h6" fontWeight="bold">
            Confirmar Pagamento
          </Typography>
        </Box>

        <CardContent>
          <Stack spacing={3}>
            {/* Valor */}
            <Box textAlign="center" py={2}>
              <Typography variant="caption" color="text.secondary">
                Valor a pagar
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{ color: getBankColor(paymentRequest?.paymentData?.bank) }}
              >
                {formatCurrency(paymentRequest?.paymentData?.amount || 0)}
              </Typography>
            </Box>

            <Divider />

            {/* Detalhes */}
            <Stack spacing={2}>
              {paymentRequest?.paymentData?.receiverName && (
                <Box display="flex" alignItems="center" gap={2}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Destinatário
                    </Typography>
                    <Typography variant="body1">
                      {paymentRequest.paymentData.receiverName}
                    </Typography>
                  </Box>
                </Box>
              )}

              {paymentRequest?.paymentData?.bank && (
                <Box display="flex" alignItems="center" gap={2}>
                  <AccountBalanceIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Banco
                    </Typography>
                    <Chip
                      label={paymentRequest.paymentData.bank.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: getBankColor(paymentRequest.paymentData.bank),
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </Box>
                </Box>
              )}

              {paymentRequest?.paymentData?.description && (
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <PaymentIcon color="action" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Descrição
                    </Typography>
                    <Typography variant="body2">
                      {paymentRequest.paymentData.description}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Solicitado em
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(paymentRequest?.createdAt || "")}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Divider />

            {/* Ações */}
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handlePay}
                disabled={processing}
                startIcon={
                  processing ? <CircularProgress size={20} /> : <PaymentIcon />
                }
                sx={{
                  bgcolor: getBankColor(paymentRequest?.paymentData?.bank),
                  "&:hover": {
                    bgcolor: getBankColor(paymentRequest?.paymentData?.bank),
                    filter: "brightness(0.9)",
                  },
                  py: 1.5,
                }}
              >
                {processing ? "Abrindo banco..." : "Pagar Agora"}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleCancel}
                disabled={processing}
              >
                Cancelar
              </Button>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 1 }}
            >
              Ao clicar em "Pagar Agora", o aplicativo do seu banco será aberto
              para você completar o pagamento.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <ConfirmarContent />
    </Suspense>
  );
}
