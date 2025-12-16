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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from "@mui/material";
import {
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  OpenInNew as OpenInNewIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import NextLink from "next/link";
import { useSmartTransfers } from "@/hooks/use-smart-transfers";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { usePluggy } from "@/hooks/use-pluggy";
import { useAuth } from "@/hooks/use-auth";

interface OpenFinanceSetupProps {
  onSetupComplete?: () => void;
}

export function OpenFinanceSetup({ onSetupComplete }: OpenFinanceSetupProps) {
  const { user } = useAuth();
  const {
    hasActivePreauthorization,
    activePreauthorization,
    createPreauthorization,
  } = useSmartTransfers();
  const { contacts } = useBankPayment();
  const { connections } = usePluggy();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [hasCpf, setHasCpf] = useState<boolean | null>(null);
  const [checkingCpf, setCheckingCpf] = useState(true);

  // Verificar se tem CPF cadastrado
  useEffect(() => {
    const checkCpf = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`/api/users/cpf?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setHasCpf(data.hasCpf);
        }
      } catch (err) {
        console.error("Error checking CPF:", err);
        setHasCpf(false);
      } finally {
        setCheckingCpf(false);
      }
    };

    checkCpf();
  }, [user?.uid]);

  // Obter banco conectado (primeiro da lista)
  const connectedBank = connections?.[0];

  // Obter todos os contatos como possíveis destinatários
  const availableRecipients = contacts
    .map((contact) => {
      const defaultKey =
        contact.pixKeys?.find((pk) => pk.isDefault) || contact.pixKeys?.[0];
      return {
        id: contact.id,
        name: contact.name,
        pixKey: defaultKey?.pixKey || contact.pixKey || "",
        hasRecipientId:
          contact.pixKeys?.some((pk) => pk.pluggyRecipientId) || false,
      };
    })
    .filter((r) => r.pixKey);

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const handleCreatePreauthorization = async () => {
    if (!connectedBank || selectedRecipients.length === 0) {
      setError("Selecione pelo menos um destinatário");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await createPreauthorization({
        connectorId: 0, // Will be resolved by the preauthorization API
        itemId: connectedBank.itemId,
        recipientIds: selectedRecipients,
      });

      if (result.success && result.consentUrl) {
        setConsentUrl(result.consentUrl);
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
      setDialogOpen(false);
      onSetupComplete?.();
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
                Pagamentos Automáticos Ativos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Banco:{" "}
                {activePreauthorization?.connectorName ||
                  connectedBank?.connectorName ||
                  "Configurado"}
              </Typography>
            </Box>
            <Chip label="Ativo" color="success" size="small" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Verificar pré-requisitos
  const missingCpf = hasCpf === false;
  const missingBank = !connectedBank;
  const missingContacts = contacts.length === 0;
  const hasAllPrerequisites = hasCpf && connectedBank && contacts.length > 0;

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <BankIcon color="primary" />
              <Box flex={1}>
                <Typography variant="subtitle2">
                  Pagamentos Automáticos via PIX
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pague direto pela plataforma sem abrir o app do banco
                </Typography>
              </Box>
            </Stack>

            {/* Checklist de pré-requisitos */}
            {checkingCpf ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={1}>
                {/* CPF */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  {hasCpf ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <WarningIcon color="warning" fontSize="small" />
                  )}
                  <Typography variant="body2" flex={1}>
                    CPF cadastrado no perfil
                  </Typography>
                  {!hasCpf && (
                    <Button
                      component={NextLink}
                      href="/profile"
                      size="small"
                      variant="text"
                    >
                      Cadastrar
                    </Button>
                  )}
                </Stack>

                {/* Banco conectado */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  {connectedBank ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <WarningIcon color="warning" fontSize="small" />
                  )}
                  <Typography variant="body2" flex={1}>
                    Banco conectado via Open Finance
                  </Typography>
                  {!connectedBank && (
                    <Typography variant="caption" color="text.secondary">
                      Conecte acima
                    </Typography>
                  )}
                </Stack>

                {/* Contatos */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  {contacts.length > 0 ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <WarningIcon color="warning" fontSize="small" />
                  )}
                  <Typography variant="body2" flex={1}>
                    Contatos PIX cadastrados
                  </Typography>
                  {contacts.length === 0 && (
                    <Button
                      component={NextLink}
                      href="/contacts"
                      size="small"
                      variant="text"
                    >
                      Cadastrar
                    </Button>
                  )}
                </Stack>
              </Stack>
            )}

            <Button
              variant="contained"
              onClick={() => setDialogOpen(true)}
              startIcon={<SettingsIcon />}
              disabled={!hasAllPrerequisites || checkingCpf}
            >
              Ativar Pagamentos Automáticos
            </Button>

            {!hasAllPrerequisites && !checkingCpf && (
              <Alert severity="info">
                <Typography variant="caption">
                  Complete os itens acima para ativar pagamentos automáticos.
                </Typography>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Dialog para selecionar destinatários */}
      <Dialog
        open={dialogOpen}
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {consentUrl ? "Autorizar no Banco" : "Selecionar Destinatários"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {consentUrl ? (
            // Etapa final - autorizar
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Pré-autorização criada com sucesso!
                </Typography>
              </Alert>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Clique no botão abaixo para autorizar os pagamentos no seu
                banco. Você só precisa fazer isso uma vez.
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
                Após autorizar, você poderá fazer pagamentos PIX diretamente
                pela plataforma.
              </Typography>
            </Box>
          ) : (
            // Selecionar destinatários
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selecione os contatos que poderão receber pagamentos
                automáticos:
              </Typography>

              {connectedBank && (
                <Alert severity="info" sx={{ my: 2 }}>
                  <Typography variant="caption">
                    Banco: <strong>{connectedBank.connectorName}</strong>
                  </Typography>
                </Alert>
              )}

              {availableRecipients.length > 0 ? (
                <List dense>
                  {availableRecipients.map((recipient) => (
                    <ListItem
                      key={recipient.id}
                      onClick={() => toggleRecipient(recipient.id)}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 1,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedRecipients.includes(recipient.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={recipient.name}
                        secondary={recipient.pixKey}
                      />
                      {recipient.hasRecipientId && (
                        <Chip
                          label="Já autorizado"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Nenhum contato PIX encontrado. Cadastre contatos primeiro.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!consentUrl && (
            <>
              <Button
                onClick={() => setDialogOpen(false)}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleCreatePreauthorization}
                disabled={selectedRecipients.length === 0 || processing}
              >
                {processing ? (
                  <CircularProgress size={20} />
                ) : (
                  `Autorizar ${selectedRecipients.length} contato${
                    selectedRecipients.length !== 1 ? "s" : ""
                  }`
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
