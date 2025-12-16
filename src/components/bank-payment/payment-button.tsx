"use client";

import { useState, useMemo } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  Send as SendIcon,
  OpenInNew as OpenInNewIcon,
  AccountBalance as BankIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { usePluggy } from "@/hooks/use-pluggy";
import { useWallets } from "@/hooks/use-wallets";
import { SupportedBank } from "@/core/ports/bank-payment.port";
import { usePaymentConfirmation } from "./payment-confirmation-dialog";

type PaymentMethod = "deeplink" | "pluggy";

interface PaymentButtonProps {
  amount: number;
  description?: string;
  receiverName?: string;
  receiverPixKey?: string;
  bank?: SupportedBank;
  installmentId?: string;
  sourceWalletId?: string; // Carteira de origem para débito
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  // Pluggy-specific props
  recipientId?: string;
  recipientData?: {
    taxNumber: string;
    name: string;
    paymentInstitutionId: string;
    branch: string;
    accountNumber: string;
    accountType?: "CHECKING" | "SAVINGS";
    pixKey?: string;
  };
  // Allow specifying preferred method
  preferredMethod?: PaymentMethod;
}

export function PaymentButton({
  amount,
  description,
  receiverName,
  receiverPixKey,
  bank = "nubank",
  installmentId,
  sourceWalletId,
  variant = "contained",
  size = "medium",
  fullWidth = false,
  disabled = false,
  onSuccess,
  onError,
  recipientId,
  recipientData,
  preferredMethod = "pluggy",
}: PaymentButtonProps) {
  const {
    initiatePayment,
    isMobile,
    hasMobileDevice,
    hasMobileDeviceWithPush,
    loading,
  } = useBankPayment();
  const { initiatePayment: initiatePluggyPayment, getPaymentStatus } =
    usePluggy();
  const { wallets } = useWallets();
  const { setPendingPaymentBeforeRedirect } = usePaymentConfirmation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushSent, setPushSent] = useState(false);
  // Default to deeplink if Pluggy is preferred but not available
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(preferredMethod);
  const [pluggyPaymentUrl, setPluggyPaymentUrl] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    sourceWalletId || ""
  );

  // Get selected wallet and check balance
  const selectedWallet = useMemo(() => {
    if (!selectedWalletId && sourceWalletId) {
      setSelectedWalletId(sourceWalletId);
    }
    return (
      wallets.find((w) => w.id === (selectedWalletId || sourceWalletId)) ||
      wallets[0]
    );
  }, [wallets, selectedWalletId, sourceWalletId]);

  const hasInsufficientBalance =
    selectedWallet && amount > selectedWallet.balance;

  // Check if Pluggy payment is available
  // Pluggy requires either:
  // 1. A valid recipientId (UUID from Pluggy)
  // 2. Complete recipientData (taxNumber, paymentInstitutionId, account info)
  // Just having a PIX key is NOT enough for Pluggy - use deeplink instead
  const hasCompleteRecipientData =
    recipientData &&
    recipientData.taxNumber &&
    recipientData.paymentInstitutionId &&
    recipientData.branch &&
    recipientData.accountNumber;

  const isPluggyAvailable = Boolean(
    process.env.NEXT_PUBLIC_PLUGGY_ENABLED !== "false" &&
      (recipientId || hasCompleteRecipientData)
  );

  // Auto-switch to deeplink if Pluggy is not available
  const effectivePaymentMethod = isPluggyAvailable ? paymentMethod : "deeplink";

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
    // Se estiver no mobile e usando deeplink, não precisa de confirmação
    if (isMobile && effectivePaymentMethod === "deeplink") {
      handlePay();
    } else {
      // Mostrar diálogo de confirmação
      setDialogOpen(true);
    }
  };

  // Processar pagamento via Pluggy
  const handlePluggyPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Only use recipientData if it's complete
      const completeRecipientData = hasCompleteRecipientData
        ? recipientData
        : undefined;

      const result = await initiatePluggyPayment({
        amount,
        description,
        recipientId,
        recipientData: completeRecipientData,
        installmentId,
      });

      if (result.success && result.paymentUrl) {
        setPluggyPaymentUrl(result.paymentUrl);
        // Open payment URL in new tab
        window.open(result.paymentUrl, "_blank");
        onSuccess?.();
      } else {
        throw new Error(result.error || "Falha ao iniciar pagamento");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Erro ao processar pagamento";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // Processar pagamento via deep link
  const handleDeepLinkPayment = async () => {
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

  // Processar pagamento baseado no método selecionado
  const handlePay = async () => {
    if (effectivePaymentMethod === "pluggy") {
      await handlePluggyPayment();
    } else {
      await handleDeepLinkPayment();
    }
  };

  // Fechar diálogo
  const handleClose = () => {
    setDialogOpen(false);
    setError(null);
    setPushSent(false);
    setPluggyPaymentUrl(null);
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

      {/* Diálogo de confirmação */}
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

            {/* Seletor de carteira (apenas para Open Finance) */}
            {effectivePaymentMethod === "pluggy" && wallets.length > 0 && (
              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Carteira de débito</InputLabel>
                  <Select
                    value={selectedWalletId || selectedWallet?.id || ""}
                    label="Carteira de débito"
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    startAdornment={
                      <WalletIcon sx={{ mr: 1, color: "action.active" }} />
                    }
                  >
                    {wallets.map((wallet) => (
                      <MenuItem key={wallet.id} value={wallet.id}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          width="100%"
                        >
                          <Typography>{wallet.name}</Typography>
                          <Typography
                            variant="body2"
                            color={
                              wallet.balance >= amount
                                ? "success.main"
                                : "error.main"
                            }
                          >
                            {formatCurrency(wallet.balance)}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedWallet && (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    mt={1}
                    px={1}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Saldo disponível:
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color={
                        hasInsufficientBalance ? "error.main" : "success.main"
                      }
                    >
                      {formatCurrency(selectedWallet.balance)}
                    </Typography>
                  </Stack>
                )}
                {hasInsufficientBalance && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Saldo insuficiente na carteira selecionada
                  </Alert>
                )}
              </Box>
            )}

            {/* Seletor de método de pagamento */}
            {isPluggyAvailable && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Método de pagamento
                </Typography>
                <ToggleButtonGroup
                  value={paymentMethod}
                  exclusive
                  onChange={(_, value) => value && setPaymentMethod(value)}
                  fullWidth
                  size="small"
                  sx={{ mt: 1 }}
                >
                  <ToggleButton value="pluggy">
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <BankIcon fontSize="small" />
                      <Typography variant="caption">Open Finance</Typography>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="deeplink">
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <SmartphoneIcon fontSize="small" />
                      <Typography variant="caption">App do Banco</Typography>
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Indicador de fluxo - Deep Link */}
            {effectivePaymentMethod === "deeplink" && (
              <Box
                sx={{
                  bgcolor: "action.hover",
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
                  {isMobile
                    ? "O app do banco será aberto automaticamente"
                    : "Uma notificação será enviada para seu celular"}
                </Typography>
              </Box>
            )}

            {/* Indicador de fluxo - Pluggy */}
            {effectivePaymentMethod === "pluggy" && (
              <Box
                sx={{
                  bgcolor: "action.hover",
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
                  <BankIcon color="primary" />
                  <OpenInNewIcon sx={{ color: "primary.main" }} />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="center"
                  display="block"
                  mt={1}
                >
                  Você será redirecionado para autorizar o pagamento via Open
                  Finance
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    ✅ Transação será registrada automaticamente
                    <br />
                    ✅ Saldo da carteira será atualizado
                    <br />
                    {installmentId && "✅ Parcela será marcada como paga"}
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Banco selecionado (apenas deep link) */}
            {effectivePaymentMethod === "deeplink" && (
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
            )}

            {/* Mensagem de sucesso - Push enviado */}
            {pushSent && effectivePaymentMethod === "deeplink" && (
              <Alert severity="success">
                Notificação enviada! Verifique seu celular para completar o
                pagamento.
              </Alert>
            )}

            {/* Mensagem de sucesso - Pluggy */}
            {pluggyPaymentUrl && effectivePaymentMethod === "pluggy" && (
              <Alert severity="success">
                <Typography variant="body2">
                  Página de pagamento aberta!{" "}
                  <Link href={pluggyPaymentUrl} target="_blank" rel="noopener">
                    Clique aqui se não abriu automaticamente
                  </Link>
                </Typography>
              </Alert>
            )}

            {/* Mensagem de erro */}
            {error && <Alert severity="error">{error}</Alert>}

            {/* Aviso se não houver dispositivo móvel com push (apenas deep link) */}
            {effectivePaymentMethod === "deeplink" &&
              !isMobile &&
              !hasMobileDeviceWithPush &&
              !pushSent && (
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
            {pushSent || pluggyPaymentUrl ? "Fechar" : "Cancelar"}
          </Button>
          {!pushSent && !pluggyPaymentUrl && (
            <Button
              variant="contained"
              onClick={handlePay}
              disabled={
                processing ||
                (effectivePaymentMethod === "pluggy" &&
                  hasInsufficientBalance) ||
                (effectivePaymentMethod === "deeplink" &&
                  !isMobile &&
                  !hasMobileDeviceWithPush)
              }
              startIcon={
                processing ? (
                  <CircularProgress size={16} />
                ) : effectivePaymentMethod === "pluggy" ? (
                  <OpenInNewIcon />
                ) : (
                  <SendIcon />
                )
              }
              sx={{
                bgcolor:
                  effectivePaymentMethod === "pluggy"
                    ? "primary.main"
                    : getBankColor(bank),
                "&:hover": {
                  bgcolor:
                    effectivePaymentMethod === "pluggy"
                      ? "primary.dark"
                      : getBankColor(bank),
                  filter: "brightness(0.9)",
                },
              }}
            >
              {processing
                ? "Processando..."
                : effectivePaymentMethod === "pluggy"
                ? "Pagar via Open Finance"
                : isMobile
                ? "Abrir App do Banco"
                : "Enviar para Celular"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
