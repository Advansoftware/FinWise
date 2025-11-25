// src/app/(app)/installments/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Tabs,
  Tab,
  Skeleton,
  Stack,
  Box,
  Grid,
} from "@mui/material";
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import { useInstallments } from "@/hooks/use-installments";
import { CreateInstallmentDialog } from "@/components/installments/create-installment-dialog";
import { InstallmentCard } from "@/components/installments/installment-card";
import { PaymentSchedule } from "@/components/installments/payment-schedule";
import { MonthlyProjections } from "@/components/installments/monthly-projections";
import { GamificationGuide, DailyQuestsCard } from "@/components/gamification";
import { formatCurrency } from "@/lib/utils";

export default function InstallmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // Ativos é a aba padrão agora
  const { installments, summary, isLoading } = useInstallments();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Stack spacing={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton
            variant="text"
            width="100%"
            height={24}
            sx={{ maxWidth: 400 }}
          />
        </Stack>

        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, lg: 3 }}>
              <Skeleton
                variant="rectangular"
                height={100}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>

        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }

  const activeInstallments = installments.filter(
    (i) => i.isActive && !i.isCompleted
  );
  const completedInstallments = installments.filter((i) => i.isCompleted);

  return (
    <Stack spacing={{ xs: 2, md: 4 }} sx={{ p: { xs: 2, md: 0 } }}>
      {/* Header */}
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}
            >
              Parcelamentos
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Gerencie suas prestações e acompanhe pagamentos.
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <GamificationGuide />
            <Button
              variant="contained"
              onClick={() => setIsCreateOpen(true)}
              startIcon={<Plus size={18} />}
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Novo Parcelamento
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Missões de Parcelamentos */}
      <DailyQuestsCard pageContext="installments" compact />

      {/* Alerta de Atraso */}
      {summary && summary.overduePayments.length > 0 && (
        <Card
          sx={{
            border: "1px solid rgba(239, 68, 68, 0.5)",
            bgcolor: "rgba(239, 68, 68, 0.08)",
          }}
        >
          <CardHeader
            title={
              <Box display="flex" alignItems="center" gap={1}>
                <AlertTriangle size={18} color="#f87171" />
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#f87171",
                    fontSize: { xs: "0.9rem", md: "1rem" },
                  }}
                >
                  {summary.overduePayments.length} Parcela
                  {summary.overduePayments.length > 1 ? "s" : ""} em Atraso
                </Typography>
              </Box>
            }
            subheader={
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(248, 113, 113, 0.8)",
                  mt: 0.5,
                  display: { xs: "none", sm: "block" },
                }}
              >
                Pagamentos vencidos que precisam de atenção.
              </Typography>
            }
            sx={{ pb: 0 }}
          />
          <CardContent sx={{ pt: 2 }}>
            <Stack spacing={1.5}>
              {summary.overduePayments.slice(0, 2).map((payment) => {
                const installment = installments.find((inst) =>
                  inst.payments.some((p) => p.id === payment.id)
                );
                const daysOverdue = Math.floor(
                  (new Date().getTime() - new Date(payment.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <Box
                    key={payment.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                    p={1.5}
                    bgcolor="background.paper"
                    borderRadius={1}
                    border="1px solid"
                    borderColor="rgba(239, 68, 68, 0.3)"
                  >
                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="text.primary"
                        noWrap
                      >
                        {installment?.name || "Parcelamento"} - P
                        {payment.installmentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {daysOverdue}d atraso
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="error.main"
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {formatCurrency(payment.scheduledAmount)}
                    </Typography>
                  </Box>
                );
              })}

              {summary.overduePayments.length > 2 && (
                <Typography
                  variant="caption"
                  textAlign="center"
                  display="block"
                  sx={{ color: "#f87171" }}
                >
                  +{summary.overduePayments.length - 2} parcela(s) em atraso
                </Typography>
              )}

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={() => setActiveTab("active")}
                  sx={{
                    borderColor: "#f87171",
                    color: "#f87171",
                    "&:hover": {
                      borderColor: "#ef4444",
                      bgcolor: "rgba(239, 68, 68, 0.08)",
                    },
                  }}
                >
                  Quitar
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={() => setActiveTab("schedule")}
                  sx={{
                    borderColor: "text.secondary",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "text.primary",
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  Cronograma
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards com Gradient */}
      <Card
        sx={{
          background:
            "linear-gradient(to right, rgba(23, 37, 84, 0.3), rgba(6, 78, 59, 0.3))",
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Grid container spacing={{ xs: 1, md: 2 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                p={{ xs: 1.5, md: 2 }}
                borderRadius={2}
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  height: "100%",
                }}
              >
                <Stack spacing={0.25}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Ativos
                    </Typography>
                    <CreditCard size={14} style={{ opacity: 0.5 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}
                  >
                    {summary?.totalActiveInstallments || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.6rem", md: "0.7rem" } }}
                  >
                    {activeInstallments.length} em andamento
                  </Typography>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                p={{ xs: 1.5, md: 2 }}
                borderRadius={2}
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  height: "100%",
                }}
              >
                <Stack spacing={0.25}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Mensal
                    </Typography>
                    <DollarSign size={14} style={{ opacity: 0.5 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ fontSize: { xs: "0.95rem", md: "1.25rem" } }}
                  >
                    {formatCurrency(summary?.totalMonthlyCommitment || 0)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.6rem", md: "0.7rem" } }}
                  >
                    Total parcelas
                  </Typography>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                p={{ xs: 1.5, md: 2 }}
                borderRadius={2}
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  border:
                    summary && summary.overduePayments.length > 0
                      ? "1px solid rgba(239, 68, 68, 0.5)"
                      : "1px solid rgba(255, 255, 255, 0.15)",
                  height: "100%",
                }}
              >
                <Stack spacing={0.25}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: "0.65rem", md: "0.75rem" },
                        color:
                          summary && summary.overduePayments.length > 0
                            ? "error.main"
                            : "text.secondary",
                      }}
                    >
                      {summary && summary.overduePayments.length > 0
                        ? "Atrasadas"
                        : "Próximos"}
                    </Typography>
                    {summary && summary.overduePayments.length > 0 ? (
                      <AlertTriangle
                        size={14}
                        color="var(--mui-palette-error-main)"
                      />
                    ) : (
                      <Clock size={14} style={{ opacity: 0.5 }} />
                    )}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}
                    color={
                      summary && summary.overduePayments.length > 0
                        ? "error.main"
                        : "text.primary"
                    }
                  >
                    {summary && summary.overduePayments.length > 0
                      ? summary.overduePayments.length
                      : summary?.upcomingPayments.length || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: { xs: "0.6rem", md: "0.7rem" } }}
                    color={
                      summary && summary.overduePayments.length > 0
                        ? "error.main"
                        : "text.secondary"
                    }
                  >
                    {summary && summary.overduePayments.length > 0
                      ? "Atenção"
                      : "30 dias"}
                  </Typography>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                p={{ xs: 1.5, md: 2 }}
                borderRadius={2}
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  height: "100%",
                }}
              >
                <Stack spacing={0.25}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                    >
                      Quitados
                    </Typography>
                    <CheckCircle2
                      size={14}
                      color="var(--mui-palette-success-main)"
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="success.main"
                    sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}
                  >
                    {completedInstallments.length}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.6rem", md: "0.7rem" } }}
                  >
                    Finalizados
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Box>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 2,
            mx: { xs: -2, md: 0 },
            px: { xs: 2, md: 0 },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                minHeight: 40,
                py: 1,
                px: { xs: 1.5, md: 2 },
                fontSize: { xs: "0.75rem", md: "0.875rem" },
              },
            }}
          >
            <Tab label="Ativos" value="active" />
            <Tab label="Cronograma" value="schedule" />
            <Tab label="Projeções" value="projections" />
            <Tab label="Finalizados" value="completed" />
          </Tabs>
        </Box>

        {activeTab === "active" && (
          <Box>
            {activeInstallments.length === 0 ? (
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: { xs: 4, md: 8 },
                  }}
                >
                  <CreditCard
                    size={40}
                    style={{ opacity: 0.5, marginBottom: 12 }}
                  />
                  <Typography variant="subtitle1" gutterBottom>
                    Nenhum parcelamento ativo
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ mb: 2, px: 2 }}
                  >
                    Comece criando seu primeiro parcelamento.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setIsCreateOpen(true)}
                    startIcon={<Plus size={16} />}
                  >
                    Criar Parcelamento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {activeInstallments.map((installment) => (
                  <Grid key={installment.id} size={{ xs: 12, md: 6 }}>
                    <InstallmentCard installment={installment} showActions />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {activeTab === "schedule" && <PaymentSchedule />}

        {activeTab === "projections" && <MonthlyProjections />}

        {activeTab === "completed" && (
          <Box>
            {completedInstallments.length === 0 ? (
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: { xs: 4, md: 8 },
                    px: 2,
                  }}
                >
                  <CheckCircle2
                    size={40}
                    style={{ opacity: 0.5, marginBottom: 12 }}
                  />
                  <Typography variant="subtitle1" gutterBottom>
                    Nenhum parcelamento concluído
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Parcelamentos finalizados aparecerão aqui.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {completedInstallments.map((installment) => (
                  <Grid key={installment.id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <InstallmentCard
                      installment={installment}
                      showActions={false}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>

      {/* Create Dialog */}
      <CreateInstallmentDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </Stack>
  );
}
