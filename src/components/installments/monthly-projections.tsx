// src/components/installments/monthly-projections.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Grid,
  useTheme,
  alpha,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Tabs,
  Tab,
  Skeleton,
} from "@mui/material";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Percent,
  Home,
  CreditCard,
  Repeat,
  Clock,
} from "lucide-react";
import { useInstallments } from "@/hooks/use-installments";
import { usePayroll } from "@/hooks/use-payroll";
import { formatCurrency } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthlyInstallmentsModal } from "./monthly-installments-modal";

interface MonthlyProjection {
  month: string;
  totalCommitment: number;
  installments: Array<{
    installmentId: string;
    name: string;
    amount: number;
    isRecurring?: boolean; // Adicionar campo para identificar recorrentes
  }>;
}

export function MonthlyProjections() {
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [includePastMonths, setIncludePastMonths] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<{
    month: string;
    monthName: string;
    totalAmount: number;
    commitmentType?: "fixed" | "variable";
  } | null>(null);
  const [activeTab, setActiveTab] = useState("fixed");

  const { getMonthlyProjections } = useInstallments();
  const { payrollData } = usePayroll();
  const theme = useTheme();

  // Separar projeções por tipo
  const getProjectionsByType = (type: "fixed" | "variable") => {
    return projections.map((projection) => ({
      ...projection,
      installments: projection.installments.filter((installment) =>
        type === "fixed"
          ? installment.isRecurring === true
          : installment.isRecurring !== true
      ),
      totalCommitment: projection.installments
        .filter((installment) =>
          type === "fixed"
            ? installment.isRecurring === true
            : installment.isRecurring !== true
        )
        .reduce((sum, installment) => sum + installment.amount, 0),
    }));
  };

  const fixedProjections = getProjectionsByType("fixed");
  const variableProjections = getProjectionsByType("variable");

  useEffect(() => {
    const loadProjections = async () => {
      setIsLoading(true);
      const data = await getMonthlyProjections(
        selectedMonths + includePastMonths
      );
      setProjections(data);
      setIsLoading(false);
    };

    loadProjections();
  }, [getMonthlyProjections, selectedMonths, includePastMonths]);

  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy", { locale: ptBR });
  };

  const calculateSalaryPercentage = (amount: number) => {
    if (!payrollData?.netSalary || payrollData.netSalary <= 0) return null;
    return (amount / payrollData.netSalary) * 100;
  };

  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) return "";
    return `${percentage.toFixed(1)}%`;
  };

  const getPercentageStatus = (percentage: number | null) => {
    if (percentage === null) return "info";
    if (percentage >= 80) return "error";
    if (percentage >= 50) return "warning";
    if (percentage >= 30) return "warning";
    return "success";
  };

  // Calcular valores baseados APENAS nos gastos variáveis (excluindo fixos)
  const variableOnlyProjections = projections.map((projection) => ({
    ...projection,
    installments: projection.installments.filter(
      (installment) => installment.isRecurring !== true
    ),
    totalCommitment: projection.installments
      .filter((installment) => installment.isRecurring !== true)
      .reduce((sum, installment) => sum + installment.amount, 0),
  }));

  const totalCommitment = variableOnlyProjections.reduce(
    (sum, p) => sum + p.totalCommitment,
    0
  );
  const averageCommitment =
    variableOnlyProjections.length > 0
      ? totalCommitment / variableOnlyProjections.length
      : 0;
  const maxCommitment = Math.max(
    ...variableOnlyProjections.map((p) => p.totalCommitment),
    0
  );

  const handleCardClick = (projection: MonthlyProjection) => {
    if (projection.installments.length > 0) {
      setSelectedMonth({
        month: projection.month,
        monthName: formatMonthYear(projection.month),
        totalAmount: projection.totalCommitment,
        commitmentType: activeTab as "fixed" | "variable",
      });
    }
  };

  const renderProjectionCards = (
    projectionsData: MonthlyProjection[],
    type: "fixed" | "variable"
  ) => {
    const maxCommitment = Math.max(
      ...projectionsData.map((p) => p.totalCommitment),
      0
    );

    return (
      <Grid container spacing={2}>
        {projectionsData.map((projection) => {
          const salaryPercentage = calculateSalaryPercentage(
            projection.totalCommitment
          );
          const status = getPercentageStatus(salaryPercentage);

          return (
            <Grid key={projection.month} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                sx={{
                  position: "relative",
                  transition: "all 0.2s",
                  cursor:
                    projection.installments.length > 0 ? "pointer" : "default",
                  opacity: projection.installments.length > 0 ? 1 : 0.6,
                  "&:hover":
                    projection.installments.length > 0
                      ? {
                          transform: "scale(1.05)",
                          boxShadow: 3,
                        }
                      : {},
                }}
                onClick={() => handleCardClick(projection)}
              >
                {/* Indicador de porcentagem do salário */}
                {salaryPercentage !== null &&
                  projection.totalCommitment > 0 && (
                    <Chip
                      label={`${formatPercentage(salaryPercentage)}`}
                      size="small"
                      icon={
                        <Percent
                          style={{ width: "0.75rem", height: "0.75rem" }}
                        />
                      }
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        height: 24,
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                        bgcolor: `${status}.lighter`,
                        color: `${status}.main`,
                        "& .MuiChip-icon": {
                          color: `${status}.main`,
                        },
                      }}
                    />
                  )}

                {/* Indicador de tipo */}
                <Chip
                  label={type === "fixed" ? "Fixo" : "Variável"}
                  size="small"
                  icon={
                    type === "fixed" ? (
                      <Home style={{ width: "0.75rem", height: "0.75rem" }} />
                    ) : (
                      <CreditCard
                        style={{ width: "0.75rem", height: "0.75rem" }}
                      />
                    )
                  }
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: "medium",
                    bgcolor:
                      type === "fixed"
                        ? alpha(theme.palette.info.main, 0.1)
                        : alpha(theme.palette.success.main, 0.1),
                    color: type === "fixed" ? "info.main" : "success.main",
                    border: 1,
                    borderColor:
                      type === "fixed"
                        ? alpha(theme.palette.info.main, 0.2)
                        : alpha(theme.palette.success.main, 0.2),
                    "& .MuiChip-icon": {
                      color: type === "fixed" ? "info.main" : "success.main",
                    },
                  }}
                />

                <CardHeader
                  title={formatMonthYear(projection.month)}
                  titleTypographyProps={{
                    variant: "h6",
                    sx: { fontSize: "1.125rem", textTransform: "capitalize" },
                  }}
                  sx={{ pb: 3, pt: 8 }}
                />

                <CardContent
                  sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatCurrency(projection.totalCommitment)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total do mês
                    </Typography>
                  </Box>

                  {projection.installments.length > 0 && (
                    <Stack spacing={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {type === "fixed"
                          ? "Compromissos Fixos:"
                          : "Parcelamentos:"}
                      </Typography>
                      <Stack spacing={0.5}>
                        {projection.installments
                          .slice(0, 3)
                          .map((installment, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.75rem",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  flex: 1,
                                  mr: 1,
                                }}
                              >
                                {installment.isRecurring && (
                                  <Repeat
                                    style={{
                                      width: "0.75rem",
                                      height: "0.75rem",
                                    }}
                                  />
                                )}
                                {installment.name}
                              </Box>
                              <Typography variant="caption" fontWeight="medium">
                                {formatCurrency(installment.amount)}
                              </Typography>
                            </Box>
                          ))}
                        {projection.installments.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{projection.installments.length - 3} mais
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  )}

                  {projection.installments.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                    >
                      Clique para ver detalhes
                    </Typography>
                  )}

                  {/* Visual indicator */}
                  <Box
                    sx={{
                      width: "100%",
                      height: "0.5rem",
                      borderRadius: 999,
                      bgcolor: "action.hover",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        transition: "all 0.3s",
                        bgcolor:
                          type === "fixed" ? "info.main" : "success.main",
                        width: `${
                          maxCommitment > 0
                            ? (projection.totalCommitment / maxCommitment) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <Grid container spacing={4}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 4 }}>
              <Skeleton
                variant="rectangular"
                height={96}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={384} sx={{ borderRadius: 1 }} />
      </Stack>
    );
  }

  return (
    <Stack spacing={6}>
      {/* Summary Cards */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title="Compromisso Variável Total"
              action={
                <DollarSign
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: theme.palette.text.secondary,
                  }}
                />
              }
              titleTypographyProps={{
                variant: "subtitle2",
                fontWeight: "medium",
              }}
              sx={{ pb: 2 }}
            />
            <CardContent>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(totalCommitment)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gastos variáveis - Próximos {selectedMonths} + últimos{" "}
                {includePastMonths} meses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title="Média Mensal Variável"
              action={
                <BarChart3
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: theme.palette.text.secondary,
                  }}
                />
              }
              titleTypographyProps={{
                variant: "subtitle2",
                fontWeight: "medium",
              }}
              sx={{ pb: 2 }}
            />
            <CardContent>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(averageCommitment)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Valor médio de gastos variáveis por mês
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title="Maior Compromisso Variável"
              action={
                <TrendingUp
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: theme.palette.text.secondary,
                  }}
                />
              }
              titleTypographyProps={{
                variant: "subtitle2",
                fontWeight: "medium",
              }}
              sx={{ pb: 2 }}
            />
            <CardContent>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(maxCommitment)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mês com maior gasto variável
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Period Selector */}
      <Stack spacing={4}>
        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
            Período futuro:
          </Typography>
          <Stack direction="row" spacing={2}>
            {[6, 12, 24].map((months) => (
              <Button
                key={months}
                variant={selectedMonths === months ? "contained" : "outlined"}
                size="small"
                onClick={() => setSelectedMonths(months)}
              >
                {months} meses
              </Button>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
            Incluir histórico:
          </Typography>
          <Stack direction="row" spacing={2}>
            {[0, 3, 6, 12].map((months) => (
              <Button
                key={months}
                variant={
                  includePastMonths === months ? "contained" : "outlined"
                }
                size="small"
                onClick={() => setIncludePastMonths(months)}
              >
                {months === 0 ? "Nenhum" : `${months} meses`}
              </Button>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Tabs para separar por tipo */}
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Home style={{ width: "1rem", height: "1rem" }} />
                  Comprometimento Fixo
                </Box>
              }
              value="fixed"
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CreditCard style={{ width: "1rem", height: "1rem" }} />
                  Comprometimento Variável
                </Box>
              }
              value="variable"
            />
          </Tabs>
        </Box>

        {activeTab === "fixed" && (
          <Stack spacing={4}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
              <Home
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  color: theme.palette.info.main,
                }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  color="info.main"
                >
                  Compromissos Fixos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gastos recorrentes mensais - o que importa é o impacto mensal
                  no orçamento
                </Typography>
              </Box>
            </Box>

            {fixedProjections.length === 0 ||
            fixedProjections.every((p) => p.totalCommitment === 0) ? (
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                  }}
                >
                  <Home
                    style={{
                      width: "3rem",
                      height: "3rem",
                      color: theme.palette.text.secondary,
                      marginBottom: "1rem",
                    }}
                  />
                  <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1 }}>
                    Nenhum compromisso fixo
                  </Typography>
                  <Typography color="text.secondary" align="center">
                    Não há parcelamentos recorrentes previstos para o período
                    selecionado.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={6}>
                {/* Card de resumo mensal dos gastos fixos */}
                <Card
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderColor: alpha(theme.palette.info.main, 0.2),
                  }}
                >
                  <CardHeader
                    title={
                      <Typography
                        variant="h6"
                        sx={{
                          color: "info.main",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Home style={{ width: "1.25rem", height: "1.25rem" }} />
                        Impacto Mensal dos Gastos Fixos
                      </Typography>
                    }
                  />
                  <CardContent sx={{ spaceY: 4 }}>
                    {(() => {
                      // Calcular total mensal dos gastos fixos
                      const uniqueFixedCommitments = new Map();
                      fixedProjections.forEach((projection) => {
                        projection.installments.forEach((installment) => {
                          if (installment.isRecurring === true) {
                            uniqueFixedCommitments.set(
                              installment.name,
                              installment.amount
                            );
                          }
                        });
                      });

                      const totalMonthlyFixed = Array.from(
                        uniqueFixedCommitments.values()
                      ).reduce(
                        (sum: number, amount: number) => sum + amount,
                        0
                      );
                      const salaryPercentage =
                        calculateSalaryPercentage(totalMonthlyFixed);

                      return (
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="h4"
                            fontWeight="bold"
                            color="info.main"
                          >
                            {formatCurrency(totalMonthlyFixed)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="info.main"
                            sx={{ mb: 1, opacity: 0.8 }}
                          >
                            Compromisso fixo mensal
                          </Typography>
                          {salaryPercentage !== null && (
                            <Chip
                              label={`${formatPercentage(
                                salaryPercentage
                              )} do salário`}
                              variant="outlined"
                              icon={
                                <Percent
                                  style={{
                                    width: "0.75rem",
                                    height: "0.75rem",
                                  }}
                                />
                              }
                              sx={{
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: "info.main",
                                borderColor: alpha(
                                  theme.palette.info.main,
                                  0.3
                                ),
                                "& .MuiChip-icon": { color: "info.main" },
                              }}
                            />
                          )}
                        </Box>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Lista dos gastos fixos individuais */}
                <Stack spacing={3}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    color="info.main"
                  >
                    Detalhamento dos Gastos Fixos:
                  </Typography>
                  <Stack spacing={3}>
                    {(() => {
                      const uniqueFixedCommitments = new Map();
                      fixedProjections.forEach((projection) => {
                        projection.installments.forEach((installment) => {
                          if (installment.isRecurring === true) {
                            uniqueFixedCommitments.set(installment.name, {
                              name: installment.name,
                              amount: installment.amount,
                              category: "Gasto Fixo",
                            });
                          }
                        });
                      });

                      return Array.from(uniqueFixedCommitments.values()).map(
                        (commitment: any) => {
                          const salaryPercentage = calculateSalaryPercentage(
                            commitment.amount
                          );
                          const status = getPercentageStatus(salaryPercentage);

                          return (
                            <Card
                              key={commitment.name}
                              sx={{
                                transition: "box-shadow 0.2s",
                                "&:hover": { boxShadow: 3 },
                                bgcolor: "background.paper",
                                borderColor: alpha(
                                  theme.palette.info.main,
                                  0.1
                                ),
                              }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 2,
                                      flex: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        p: 1,
                                        bgcolor: alpha(
                                          theme.palette.info.main,
                                          0.1
                                        ),
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Repeat
                                        style={{
                                          width: "1rem",
                                          height: "1rem",
                                          color: theme.palette.info.main,
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight="medium"
                                      >
                                        {commitment.name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {commitment.category}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      variant="h6"
                                      fontWeight="bold"
                                      color="info.main"
                                    >
                                      {formatCurrency(commitment.amount)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      por mês
                                    </Typography>
                                    {salaryPercentage !== null && (
                                      <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                          label={formatPercentage(
                                            salaryPercentage
                                          )}
                                          variant="outlined"
                                          size="small"
                                          sx={{
                                            fontSize: "0.75rem",
                                            height: 20,
                                            bgcolor: `${status}.lighter`,
                                            color: `${status}.main`,
                                            borderColor: `${status}.light`,
                                          }}
                                        />
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        }
                      );
                    })()}
                  </Stack>
                </Stack>
              </Stack>
            )}
          </Stack>
        )}

        {activeTab === "variable" && (
          <Stack spacing={4}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
              <CreditCard
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  color: theme.palette.success.main,
                }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  color="success.main"
                >
                  Compromissos Variáveis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empréstimos, financiamentos e parcelamentos com prazo definido
                </Typography>
              </Box>
            </Box>

            {variableProjections.length === 0 ||
            variableProjections.every((p) => p.totalCommitment === 0) ? (
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                  }}
                >
                  <CreditCard
                    style={{
                      width: "3rem",
                      height: "3rem",
                      color: theme.palette.text.secondary,
                      marginBottom: "1rem",
                    }}
                  />
                  <Typography variant="h6" fontWeight="semibold" sx={{ mb: 1 }}>
                    Nenhum compromisso variável
                  </Typography>
                  <Typography color="text.secondary" align="center">
                    Não há parcelamentos com prazo definido previstos para o
                    período selecionado.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              renderProjectionCards(variableProjections, "variable")
            )}
          </Stack>
        )}
      </Box>

      {/* Modal */}
      {selectedMonth && (
        <MonthlyInstallmentsModal
          isOpen={!!selectedMonth}
          onOpenChange={(open) => !open && setSelectedMonth(null)}
          month={selectedMonth.month}
          monthName={selectedMonth.monthName}
          totalAmount={selectedMonth.totalAmount}
          commitmentType={selectedMonth.commitmentType}
        />
      )}
    </Stack>
  );
}
