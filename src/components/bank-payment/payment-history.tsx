"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
  Collapse,
  Divider,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Smartphone as SmartphoneIcon,
  OpenInNew as OpenInNewIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { PaymentRequest } from "@/core/ports/bank-payment.port";

const STATUS_CONFIG: Record<
  string,
  {
    color:
      | "default"
      | "primary"
      | "secondary"
      | "success"
      | "error"
      | "warning"
      | "info";
    label: string;
    icon: React.ReactNode;
  }
> = {
  pending: { color: "warning", label: "Pendente", icon: <ScheduleIcon /> },
  sent: { color: "info", label: "Enviado", icon: <SendIcon /> },
  opened: { color: "primary", label: "Aberto", icon: <OpenInNewIcon /> },
  completed: {
    color: "success",
    label: "Concluído",
    icon: <CheckCircleIcon />,
  },
  failed: { color: "error", label: "Falhou", icon: <ErrorIcon /> },
  cancelled: { color: "default", label: "Cancelado", icon: <CancelIcon /> },
  expired: { color: "default", label: "Expirado", icon: <ScheduleIcon /> },
};

const BANKS_COLORS: Record<string, string> = {
  nubank: "#820AD1",
  itau: "#FF6600",
  bradesco: "#CC092F",
  santander: "#EC0000",
  inter: "#FF7A00",
  c6: "#1A1A1A",
  picpay: "#21C25E",
  mercadopago: "#00A8E8",
};

interface PaymentHistoryItemProps {
  request: PaymentRequest;
}

function PaymentHistoryItem({ request }: PaymentHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const bankColor = BANKS_COLORS[request.paymentData?.bank || ""] || "#1976d2";

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

  // Formatação de data curta
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return formatDate(dateString);
  };

  // Obter descrição do evento
  const getEventDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      created: "Solicitação criada",
      push_sent: "Notificação enviada",
      deep_link_opened: "App do banco aberto",
      completed: "Pagamento concluído",
      failed: "Falha no pagamento",
      cancelled: "Pagamento cancelado",
      expired: "Pagamento expirado",
    };
    return descriptions[type] || type;
  };

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          onClick={() => setExpanded(!expanded)}
          sx={{ cursor: "pointer" }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: bankColor,
              fontSize: "0.75rem",
            }}
          >
            {request.paymentData?.bank?.slice(0, 2).toUpperCase() || "PG"}
          </Avatar>

          <Box flex={1}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(request.paymentData?.amount || 0)}
              </Typography>
              <Chip
                label={statusConfig.label}
                size="small"
                color={statusConfig.color}
                icon={statusConfig.icon as React.ReactElement}
                sx={{ height: 22 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {request.paymentData?.receiverName ||
                "Destinatário não informado"}{" "}
              • {formatShortDate(request.createdAt)}
            </Typography>
          </Box>

          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>

        <Collapse in={expanded}>
          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1}>
            {/* Detalhes */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Descrição
              </Typography>
              <Typography variant="body2">
                {request.paymentData?.description || "Sem descrição"}
              </Typography>
            </Box>

            {request.paymentData?.receiverPixKey && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Chave PIX
                </Typography>
                <Typography variant="body2">
                  {request.paymentData.receiverPixKey}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary">
                Origem
              </Typography>
              <Stack direction="row" alignItems="center" gap={0.5}>
                {request.originDevice === "mobile" ? (
                  <SmartphoneIcon sx={{ fontSize: 16 }} />
                ) : (
                  <SmartphoneIcon
                    sx={{ fontSize: 16, transform: "rotate(90deg)" }}
                  />
                )}
                <Typography variant="body2">
                  {request.originDevice === "mobile" ? "Celular" : "Computador"}
                </Typography>
              </Stack>
            </Box>

            {/* Timeline de eventos */}
            {request.events && request.events.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  Histórico
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {request.events.map((event, index) => (
                    <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              index === request.events!.length - 1
                                ? "primary.main"
                                : "grey.400",
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={getEventDescription(event.type)}
                        secondary={formatDate(event.timestamp)}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export function PaymentHistory() {
  const { paymentHistory, loading, refreshPaymentHistory } = useBankPayment();

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <HistoryIcon />
          <Typography variant="h6">Histórico de Pagamentos</Typography>
        </Stack>
        <IconButton onClick={refreshPaymentHistory} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Lista de pagamentos */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : paymentHistory.length === 0 ? (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} py={4}>
              <HistoryIcon sx={{ fontSize: 48, color: "grey.400" }} />
              <Typography color="text.secondary">
                Nenhum pagamento realizado
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Quando você fizer pagamentos, eles aparecerão aqui.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {paymentHistory.map((request) => (
            <PaymentHistoryItem key={request.id} request={request} />
          ))}
        </Box>
      )}
    </Box>
  );
}
