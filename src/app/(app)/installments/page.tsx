// src/app/(app)/installments/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Skeleton,
  Stack,
  Box,
  IconButton,
} from "@mui/material";
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Trophy,
  Award,
  Flame,
  Target,
} from "lucide-react";
import { useInstallments } from "@/hooks/use-installments";
import { CreateInstallmentDialog } from "@/components/installments/create-installment-dialog";
import { InstallmentCard } from "@/components/installments/installment-card";
import { PaymentSchedule } from "@/components/installments/payment-schedule";
import { MonthlyProjections } from "@/components/installments/monthly-projections";
import { GamificationGuide } from "@/components/installments/gamification-guide";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";

export default function InstallmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gamification"); // Progresso é a aba padrão
  const { installments, summary, isLoading } = useInstallments();
  const { gamificationData, isLoading: isGamificationLoading } =
    useGamification();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Função para traduzir raridade dos badges
  const translateRarity = (rarity: string) => {
    const translations: Record<string, string> = {
      common: "Comum",
      rare: "Raro",
      epic: "Épico",
      legendary: "Lendário",
      mythic: "Mítico",
    };
    return translations[rarity] || rarity;
  };

  if (isLoading) {
    return (
      <Stack spacing={4} p={4}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={400} height={24} />
        </Stack>

        <Box
          display="grid"
          gridTemplateColumns={{
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "1fr 1fr 1fr 1fr",
          }}
          gap={4}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={128}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>

        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }

  const activeInstallments = installments.filter(
    (i) => i.isActive && !i.isCompleted
  );
  const completedInstallments = installments.filter((i) => i.isCompleted);

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Parcelamentos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie suas prestações, acompanhe pagamentos e projete
              compromissos futuros.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
          >
            <GamificationGuide
              currentPoints={gamificationData?.points}
              currentLevel={gamificationData?.level}
              badges={gamificationData?.badges}
            />
            <Button
              variant="contained"
              onClick={() => setIsCreateOpen(true)}
              startIcon={<Plus size={18} />}
            >
              Novo Parcelamento
            </Button>
          </Stack>
        </Stack>
      </Stack>

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
                <AlertTriangle size={20} color="#f87171" />
                <Typography variant="h6" sx={{ color: "#f87171" }}>
                  {summary.overduePayments.length} Parcela
                  {summary.overduePayments.length > 1 ? "s" : ""} em Atraso
                </Typography>
              </Box>
            }
            subheader={
              <Typography
                variant="body2"
                sx={{ color: "rgba(248, 113, 113, 0.8)", mt: 0.5 }}
              >
                Você tem pagamentos vencidos que precisam de atenção imediata.
              </Typography>
            }
          />
          <CardContent>
            <Stack spacing={2}>
              {summary.overduePayments.slice(0, 3).map((payment) => {
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
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    flexDirection={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1}
                    p={2}
                    bgcolor="background.paper"
                    borderRadius={1}
                    border="1px solid"
                    borderColor="rgba(239, 68, 68, 0.3)"
                  >
                    <Box flex={1}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="text.primary"
                      >
                        {installment?.name || "Parcelamento"} - Parcela{" "}
                        {payment.installmentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Venceu em{" "}
                        {new Date(payment.dueDate).toLocaleDateString("pt-BR")}{" "}
                        • {daysOverdue} dias de atraso
                      </Typography>
                    </Box>
                    <Box
                      textAlign={{ xs: "left", sm: "right" }}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="text.primary"
                      >
                        {formatCurrency(payment.scheduledAmount)}
                      </Typography>
                      <Chip
                        label="Em Atraso"
                        size="small"
                        sx={{
                          bgcolor: "rgba(239, 68, 68, 0.15)",
                          color: "#f87171",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}

              {summary.overduePayments.length > 3 && (
                <Typography
                  variant="caption"
                  textAlign="center"
                  display="block"
                  sx={{ color: "#f87171" }}
                >
                  E mais {summary.overduePayments.length - 3} parcela
                  {summary.overduePayments.length - 3 > 1 ? "s" : ""} em atraso
                </Typography>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    // TODO: Implementar funcionalidade de quitar múltiplas pendências
                    setActiveTab("active");
                  }}
                  sx={{
                    borderColor: "#f87171",
                    color: "#f87171",
                    "&:hover": {
                      borderColor: "#ef4444",
                      bgcolor: "rgba(239, 68, 68, 0.08)",
                    },
                  }}
                >
                  Quitar Pendências
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
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
                  Ver Cronograma
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }}
        gap={4}
      >
        <Card>
          <CardHeader
            title={
              <Typography variant="subtitle2" color="text.secondary">
                Parcelamentos Ativos
              </Typography>
            }
            action={<CreditCard size={16} style={{ opacity: 0.5 }} />}
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Typography variant="h5" fontWeight="bold">
              {summary?.totalActiveInstallments || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activeInstallments.length} em andamento
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={
              <Typography variant="subtitle2" color="text.secondary">
                Compromisso Mensal
              </Typography>
            }
            action={<DollarSign size={16} style={{ opacity: 0.5 }} />}
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(summary?.totalMonthlyCommitment || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total das parcelas mensais
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={
            summary && summary.overduePayments.length > 0
              ? { borderColor: "error.main" }
              : {}
          }
        >
          <CardHeader
            title={
              <Typography
                variant="subtitle2"
                color={
                  summary && summary.overduePayments.length > 0
                    ? "error.main"
                    : "text.secondary"
                }
              >
                {summary && summary.overduePayments.length > 0
                  ? "Parcelas em Atraso"
                  : "Próximos Vencimentos"}
              </Typography>
            }
            action={
              summary && summary.overduePayments.length > 0 ? (
                <AlertTriangle
                  size={16}
                  color="var(--mui-palette-error-main)"
                />
              ) : (
                <Clock size={16} style={{ opacity: 0.5 }} />
              )
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Typography
              variant="h5"
              fontWeight="bold"
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
              color={
                summary && summary.overduePayments.length > 0
                  ? "error.main"
                  : "text.secondary"
              }
            >
              {summary && summary.overduePayments.length > 0
                ? "Precisam de atenção"
                : "Próximos 30 dias"}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={
              <Typography variant="subtitle2" color="text.secondary">
                Parcelamentos Quitados
              </Typography>
            }
            action={
              <CheckCircle2 size={16} color="var(--mui-palette-success-main)" />
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {completedInstallments.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Finalizados com sucesso
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Box>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Progresso" value="gamification" />
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
                    py: 8,
                  }}
                >
                  <CreditCard
                    size={48}
                    style={{ opacity: 0.5, marginBottom: 16 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Nenhum parcelamento ativo
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ mb: 2 }}
                  >
                    Comece criando seu primeiro parcelamento para acompanhar
                    suas prestações.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setIsCreateOpen(true)}
                    startIcon={<Plus size={18} />}
                  >
                    Criar Parcelamento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns={{ xs: "1fr", lg: "1fr 1fr" }}
                gap={4}
              >
                {activeInstallments.map((installment) => (
                  <InstallmentCard
                    key={installment.id}
                    installment={installment}
                    showActions
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeTab === "gamification" && (
          <Stack spacing={4}>
            {isGamificationLoading ? (
              <Stack spacing={2}>
                <Skeleton
                  variant="rectangular"
                  height={160}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={100}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={250}
                  sx={{ borderRadius: 2 }}
                />
              </Stack>
            ) : gamificationData ? (
              <Stack spacing={4}>
                {/* Header da Gamificação com Guia */}
                <Card
                  sx={{
                    background: "linear-gradient(to right, #1e293b, #0f172a)",
                    color: "white",
                  }}
                >
                  <CardHeader
                    title={
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box
                            width={48}
                            height={48}
                            borderRadius="50%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                              background:
                                "linear-gradient(to bottom right, #a855f7, #3b82f6)",
                            }}
                          >
                            <Trophy size={24} color="white" />
                          </Box>
                          <Box>
                            <Typography variant="h6">
                              Nível {gamificationData.level.level} -{" "}
                              {gamificationData.level.name}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {gamificationData.points} pontos acumulados
                            </Typography>
                          </Box>
                        </Box>
                        <Box display={{ xs: "none", md: "block" }}>
                          <GamificationGuide />
                        </Box>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        fontSize="0.875rem"
                      >
                        <Typography variant="body2">
                          Progresso para o próximo nível
                        </Typography>
                        <Typography variant="body2">
                          {gamificationData.level.pointsToNext} pontos restantes
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (gamificationData.points /
                            (gamificationData.level.pointsRequired +
                              gamificationData.level.pointsToNext)) *
                          100
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "rgba(255,255,255,0.2)",
                          "& .MuiLinearProgress-bar": { bgcolor: "#3b82f6" },
                        }}
                      />

                      {gamificationData.streak > 0 && (
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          p={1.5}
                          bgcolor="rgba(249, 115, 22, 0.1)"
                          border={1}
                          borderColor="rgba(249, 115, 22, 0.3)"
                          borderRadius={1}
                        >
                          <Flame size={20} color="#f97316" />
                          <Typography
                            variant="body2"
                            color="#fb923c"
                            fontWeight="medium"
                          >
                            Sequência de {gamificationData.streak} meses pagando
                            tudo em dia! 🔥
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Badges Conquistadas */}
                {gamificationData.badges.length > 0 && (
                  <Card>
                    <CardHeader
                      title={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Award size={20} />
                          <Typography variant="h6">
                            Badges Conquistadas
                          </Typography>
                        </Box>
                      }
                    />
                    <CardContent>
                      <Box
                        display="grid"
                        gridTemplateColumns={{
                          xs: "1fr 1fr",
                          md: "1fr 1fr 1fr",
                          lg: "1fr 1fr 1fr 1fr",
                        }}
                        gap={2}
                      >
                        {gamificationData.badges.map((badge) => (
                          <motion.div
                            key={badge.id}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                          >
                            <Box
                              textAlign="center"
                              p={2}
                              border={1}
                              borderColor="divider"
                              borderRadius={2}
                              bgcolor="background.paper"
                            >
                              <Typography variant="h3" mb={1}>
                                {badge.icon}
                              </Typography>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {badge.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                mb={1}
                              >
                                {badge.description}
                              </Typography>
                              <Chip
                                label={translateRarity(badge.rarity)}
                                variant="outlined"
                                size="small"
                                sx={{
                                  borderColor:
                                    badge.rarity === "legendary"
                                      ? "warning.main"
                                      : badge.rarity === "epic"
                                      ? "secondary.main"
                                      : badge.rarity === "rare"
                                      ? "info.main"
                                      : "grey.400",
                                  color:
                                    badge.rarity === "legendary"
                                      ? "warning.main"
                                      : badge.rarity === "epic"
                                      ? "secondary.main"
                                      : badge.rarity === "rare"
                                      ? "info.main"
                                      : "text.secondary",
                                }}
                              />
                            </Box>
                          </motion.div>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Conquistas em Progresso */}
                <Card>
                  <CardHeader
                    title={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Target size={20} />
                        <Typography variant="h6">
                          Conquistas em Progresso
                        </Typography>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      {gamificationData.achievements.map((achievement) => (
                        <Box
                          key={achievement.id}
                          border={1}
                          borderColor="divider"
                          borderRadius={2}
                          p={2}
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={2}
                            mb={2}
                          >
                            <Typography variant="h5">
                              {achievement.icon}
                            </Typography>
                            <Box flex={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {achievement.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {achievement.description}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${achievement.points} pts`}
                              variant="outlined"
                              size="small"
                            />
                          </Box>

                          <Stack spacing={1}>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="caption">
                                Progresso
                              </Typography>
                              <Typography variant="caption">
                                {achievement.progress}/{achievement.target}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={
                                (achievement.progress / achievement.target) *
                                100
                              }
                            />
                            {achievement.isCompleted && (
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                                color="success.main"
                              >
                                <CheckCircle2 size={16} />
                                <Typography variant="caption" fontWeight="bold">
                                  Conquista completada!
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 8,
                  }}
                >
                  <Trophy
                    size={48}
                    style={{ opacity: 0.5, marginBottom: 16 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Jornada de Progresso
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ mb: 2 }}
                  >
                    Crie e pague seus parcelamentos em dia para ganhar pontos,
                    subir de nível e desbloquear conquistas!
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setActiveTab("active")}
                    startIcon={<CreditCard size={18} />}
                  >
                    Ver Meus Parcelamentos
                  </Button>
                </CardContent>
              </Card>
            )}
          </Stack>
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
                    py: 8,
                  }}
                >
                  <CheckCircle2
                    size={48}
                    style={{ opacity: 0.5, marginBottom: 16 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Nenhum parcelamento concluído
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Parcelamentos que você finalizar aparecerão aqui.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns={{ xs: "1fr", lg: "1fr 1fr" }}
                gap={4}
              >
                {completedInstallments.map((installment) => (
                  <InstallmentCard
                    key={installment.id}
                    installment={installment}
                    showActions={false}
                  />
                ))}
              </Box>
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
