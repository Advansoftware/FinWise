// src/components/installments/payment-schedule.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  Stack,
  Chip,
  Skeleton,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InstallmentPayment } from "@/core/ports/installments.port";
import { useInstallments } from "@/hooks/use-installments";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PaymentSchedule() {
  const [upcomingPayments, setUpcomingPayments] = useState<
    InstallmentPayment[]
  >([]);
  const [overduePayments, setOverduePayments] = useState<InstallmentPayment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const theme = useTheme();

  const { getUpcomingPayments, getOverduePayments, installments } =
    useInstallments();

  // Use installments.length as dependency instead of the entire array
  // to avoid re-fetching when installment objects update internally
  const installmentsCount = installments.length;

  useEffect(() => {
    const loadPayments = async () => {
      setIsLoading(true);
      const [upcoming, overdue] = await Promise.all([
        getUpcomingPayments(60), // Próximos 60 dias
        getOverduePayments(),
      ]);

      setUpcomingPayments(upcoming);
      setOverduePayments(overdue);
      setIsLoading(false);
    };

    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installmentsCount]);

  const getInstallmentName = (payment: InstallmentPayment) => {
    const installment = installments.find(
      (i) => i.id === payment.installmentId
    );
    return installment?.name || "Parcelamento não encontrado";
  };

  const PaymentCard = ({ payment }: { payment: InstallmentPayment }) => {
    const dueDate = parseISO(payment.dueDate);
    const installmentName = getInstallmentName(payment);

    const getStatusInfo = () => {
      if (payment.status === "paid") {
        return {
          icon: CheckCircle2,
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.05),
          borderColor: alpha(theme.palette.success.main, 0.2),
          label: "Pago",
        };
      } else if (isPast(dueDate) && !isToday(dueDate)) {
        return {
          icon: AlertTriangle,
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.05),
          borderColor: alpha(theme.palette.error.main, 0.2),
          label: "Em Atraso",
        };
      } else if (isToday(dueDate)) {
        return {
          icon: Clock,
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.05),
          borderColor: alpha(theme.palette.warning.main, 0.2),
          label: "Vence Hoje",
        };
      } else {
        return {
          icon: Calendar,
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.05),
          borderColor: alpha(theme.palette.info.main, 0.2),
          label: "Pendente",
        };
      }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
      <Card
        sx={{
          bgcolor: statusInfo.bgColor,
          borderColor: statusInfo.borderColor,
          transition: "all 0.2s",
          "&:hover": { boxShadow: 3 },
          height: "100%",
        }}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.75,
                }}
              >
                <StatusIcon
                  style={{
                    width: "0.875rem",
                    height: "0.875rem",
                    color: statusInfo.color,
                  }}
                />
                <Chip
                  label={statusInfo.label}
                  size="small"
                  sx={{
                    color: statusInfo.color,
                    borderColor: statusInfo.borderColor,
                    bgcolor: alpha(statusInfo.color, 0.1),
                    fontWeight: "bold",
                    height: 20,
                    fontSize: "0.65rem",
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                fontWeight="semibold"
                noWrap
                sx={{ mb: 0.25 }}
              >
                {installmentName}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.75, fontSize: "0.65rem" }}
              >
                Parcela {payment.installmentNumber}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.6rem" }}
                  >
                    Vencimento
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight="medium"
                    display="block"
                  >
                    {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.6rem" }}
                  >
                    Valor
                  </Typography>
                  <Typography variant="body2" fontWeight="semibold">
                    {formatCurrency(
                      payment.paidAmount || payment.scheduledAmount
                    )}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Stack spacing={{ xs: 2, md: 4 }}>
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Skeleton
                variant="rectangular"
                height={110}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2, md: 4 }}>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{ borderBottom: 1, borderColor: "divider", mb: { xs: 2, md: 3 } }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Calendar style={{ width: "0.875rem", height: "0.875rem" }} />
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Próximos
                  </Typography>
                  <Chip
                    label={upcomingPayments.length}
                    size="small"
                    sx={{ height: 18, fontSize: "0.65rem" }}
                  />
                </Box>
              }
              value="upcoming"
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AlertTriangle
                    style={{
                      width: "0.875rem",
                      height: "0.875rem",
                      color:
                        overduePayments.length > 0
                          ? theme.palette.error.main
                          : undefined,
                    }}
                  />
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Em Atraso
                  </Typography>
                  <Chip
                    label={overduePayments.length}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.65rem",
                      bgcolor:
                        overduePayments.length > 0
                          ? "error.lighter"
                          : undefined,
                      color:
                        overduePayments.length > 0 ? "error.main" : undefined,
                    }}
                  />
                </Box>
              }
              value="overdue"
            />
          </Tabs>
        </Box>

        {activeTab === "upcoming" && (
          <Box>
            {upcomingPayments.length === 0 ? (
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: { xs: 4, md: 8 },
                  }}
                >
                  <Calendar
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      color: theme.palette.text.secondary,
                      marginBottom: "0.75rem",
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight="semibold"
                    sx={{ mb: 0.5 }}
                  >
                    Nenhum vencimento próximo
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ px: 2 }}
                  >
                    Você está em dia! Não há parcelas para vencer nos próximos
                    60 dias.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {upcomingPayments.map((payment) => (
                  <Grid
                    key={`${payment.installmentId}-${payment.installmentNumber}`}
                    size={{ xs: 12, sm: 6, lg: 4 }}
                  >
                    <PaymentCard payment={payment} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {activeTab === "overdue" && (
          <Box>
            {overduePayments.length === 0 ? (
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: { xs: 4, md: 8 },
                  }}
                >
                  <CheckCircle2
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      color: theme.palette.success.main,
                      marginBottom: "0.75rem",
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight="semibold"
                    sx={{ mb: 0.5 }}
                  >
                    Nenhuma parcela em atraso
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ px: 2 }}
                  >
                    Parabéns! Você está em dia com todos os seus parcelamentos.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={{ xs: 2, md: 4 }}>
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                    border: 1,
                    borderColor: alpha(theme.palette.error.main, 0.2),
                    borderRadius: 2,
                    p: { xs: 1.5, md: 2 },
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                  >
                    <AlertTriangle
                      style={{
                        width: "1rem",
                        height: "1rem",
                        color: theme.palette.error.main,
                        marginTop: "0.125rem",
                        flexShrink: 0,
                      }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight="semibold"
                        color="error.main"
                      >
                        Atenção: Parcelas em Atraso
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.25, display: "block" }}
                      >
                        Você tem {overduePayments.length} parcela(s) em atraso.
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={{ xs: 1.5, md: 2 }}>
                  {overduePayments.map((payment) => (
                    <Grid
                      key={`${payment.installmentId}-${payment.installmentNumber}`}
                      size={{ xs: 12, sm: 6, lg: 4 }}
                    >
                      <PaymentCard payment={payment} />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </Stack>
  );
}
