// src/components/open-finance/open-finance-setup.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
} from "@mui/material";
import {
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useSmartTransfers } from "@/hooks/use-smart-transfers";
import { useBankPayment } from "@/hooks/use-bank-payment";

// Lista de bancos suportados para Smart Transfers
const SUPPORTED_BANKS = [
  { id: 612, name: "Nubank", logo: "nubank" },
  { id: 601, name: "Banco do Brasil", logo: "bb" },
  { id: 604, name: "Itaú", logo: "itau" },
  { id: 603, name: "Bradesco", logo: "bradesco" },
  { id: 606, name: "Santander", logo: "santander" },
  { id: 608, name: "Inter", logo: "inter" },
  { id: 609, name: "C6 Bank", logo: "c6" },
  { id: 611, name: "Caixa", logo: "caixa" },
];

interface OpenFinanceSetupProps {
  onSetupComplete?: () => void;
}

export function OpenFinanceSetup({ onSetupComplete }: OpenFinanceSetupProps) {
  const {
    hasActivePreauthorization,
    activePreauthorization,
    createPreauthorization,
    isLoading,
  } = useSmartTransfers();
  const { contacts } = useBankPayment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [cpf, setCpf] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);

  const steps = ["Selecionar banco", "Informar CPF", "Selecionar destinatários", "Autorizar"];

  // Get recipients from contacts
  const availableRecipients = contacts
    .flatMap((contact) =>
      (contact.pixKeys || [])
        .filter((pk) => pk.pluggyRecipientId)
        .map((pk) => ({
          id: pk.pluggyRecipientId!,
          name: contact.name,
          pixKey: pk.pixKey,
        }))
    );

  const handleNext = async () => {
    if (activeStep === steps.length - 2) {
      // Create preauthorization
      await handleCreatePreauthorization();
    } else if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleCreatePreauthorization = async () => {
    if (!selectedBank || !cpf || selectedRecipients.length === 0) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await createPreauthorization({
        connectorId: selectedBank,
        cpf: cpf.replace(/\D/g, ""),
        recipientIds: selectedRecipients,
      });

      if (result.success && result.consentUrl) {
        setConsentUrl(result.consentUrl);
        setActiveStep(steps.length - 1);
      } else {
        throw new Error(result.error || "Falha ao criar autorização");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenConsent = () => {
    if (consentUrl) {
      window.open(consentUrl, "_blank");
    }
  };

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const isNextDisabled = () => {
    switch (activeStep) {
      case 0:
        return !selectedBank;
      case 1:
        return cpf.replace(/\D/g, "").length !== 11;
      case 2:
        return selectedRecipients.length === 0;
      default:
        return false;
    }
  };

  // Already configured
  if (hasActivePreauthorization) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CheckIcon color="success" />
            <Box flex={1}>
              <Typography variant="subtitle2">
                Open Finance Configurado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Banco: {activePreauthorization?.connectorName || "Configurado"}
              </Typography>
            </Box>
            <Chip
              label="Ativo"
              color="success"
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <BankIcon color="primary" />
              <Box flex={1}>
                <Typography variant="subtitle2">
                  Configurar Open Finance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Autorize pagamentos automáticos via PIX
                </Typography>
              </Box>
            </Stack>
            <Alert severity="info">
              <Typography variant="caption">
                Configure o Open Finance para fazer pagamentos PIX diretamente
                pela plataforma, sem precisar abrir o app do banco.
              </Typography>
            </Alert>
            <Button
              variant="contained"
              onClick={() => setDialogOpen(true)}
              startIcon={<SettingsIcon />}
            >
              Configurar Agora
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configurar Open Finance</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step 0: Select Bank */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selecione o banco de onde serão feitos os pagamentos:
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {SUPPORTED_BANKS.map((bank) => (
                  <Button
                    key={bank.id}
                    variant={selectedBank === bank.id ? "contained" : "outlined"}
                    onClick={() => setSelectedBank(bank.id)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    <BankIcon sx={{ mr: 1 }} />
                    {bank.name}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          {/* Step 1: CPF */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Informe o CPF do titular da conta:
              </Typography>
              <TextField
                fullWidth
                label="CPF"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                sx={{ mt: 2 }}
                inputProps={{ maxLength: 14 }}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  O CPF é exigido pelo Open Finance para autorizar pagamentos.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Step 2: Select Recipients */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selecione os destinatários autorizados para receber pagamentos:
              </Typography>
              {availableRecipients.length > 0 ? (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {availableRecipients.map((recipient) => (
                    <Button
                      key={recipient.id}
                      variant={
                        selectedRecipients.includes(recipient.id)
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => {
                        setSelectedRecipients((prev) =>
                          prev.includes(recipient.id)
                            ? prev.filter((id) => id !== recipient.id)
                            : [...prev, recipient.id]
                        );
                      }}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      {recipient.name} - {recipient.pixKey}
                    </Button>
                  ))}
                </Stack>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Nenhum destinatário com recipient ID do Pluggy encontrado.
                    Você precisa primeiro cadastrar contatos e fazer um pagamento
                    via Open Finance para salvar o recipient ID.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Step 3: Authorize */}
          {activeStep === 3 && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Autorização criada com sucesso!
                </Typography>
              </Alert>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Clique no botão abaixo para autorizar os pagamentos no seu banco:
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleOpenConsent}
                startIcon={<OpenInNewIcon />}
                sx={{ mt: 2 }}
              >
                Autorizar no Banco
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mt={2}
              >
                Você será redirecionado para o site do seu banco para autorizar.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {activeStep > 0 && activeStep < 3 && (
            <Button onClick={handleBack} disabled={processing}>
              Voltar
            </Button>
          )}
          {activeStep < 3 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isNextDisabled() || processing}
            >
              {processing ? (
                <CircularProgress size={20} />
              ) : activeStep === 2 ? (
                "Criar Autorização"
              ) : (
                "Próximo"
              )}
            </Button>
          )}
          {activeStep === 3 && (
            <Button
              onClick={() => {
                setDialogOpen(false);
                onSetupComplete?.();
              }}
            >
              Fechar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
