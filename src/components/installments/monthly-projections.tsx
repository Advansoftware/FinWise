// src/components/installments/monthly-projections.tsx

import { useState, useEffect, useRef } from "react";
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

  // Ref para evitar loops de requisição
  const getMonthlyProjectionsRef = useRef(getMonthlyProjections);
  getMonthlyProjectionsRef.current = getMonthlyProjections;

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
      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {projectionsData.map((projection) => {
          const salaryPercentage = calculateSalaryPercentage(
            projection.totalCommitment
          );
          const status = getPercentageStatus(salaryPercentage);

          return (
            <Grid key={projection.month} size={{ xs: 12, sm: 6, lg: 4 }}>
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
                          transform: "scale(1.02)",
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
                          style={{ width: "0.65rem", height: "0.65rem" }}
                        />
                      }
                      sx={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        height: 20,
                        fontSize: "0.65rem",
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
                  label={type === "fixed" ? "Fixo" : "Var"}
                  size="small"
                  icon={
                    type === "fixed" ? (
                      <Home style={{ width: "0.65rem", height: "0.65rem" }} />
                    ) : (
                      <CreditCard
                        style={{ width: "0.65rem", height: "0.65rem" }}
                      />
                    )
                  }
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    height: 20,
                    fontSize: "0.65rem",
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
                    variant: "subtitle1",
                    sx: {
                      fontSize: { xs: "0.875rem", md: "1rem" },
                      textTransform: "capitalize",
                    },
                  }}
                  sx={{ pb: 1, pt: 5 }}
                />

                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    pt: 0,
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(projection.totalCommitment)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total do mês
                    </Typography>
                  </Box>

                  {projection.installments.length > 0 && (
                    <Stack spacing={0.5}>
                      <Typography variant="caption" fontWeight="medium">
                        {type === "fixed" ? "Compromissos:" : "Parcelamentos:"}
                      </Typography>
                      <Stack spacing={0.25}>
                        {projection.installments
                          .slice(0, 2)
                          .map((installment, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.7rem",
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
                                      width: "0.65rem",
                                      height: "0.65rem",
                                    }}
                                  />
                                )}
                                <Typography variant="caption" noWrap>
                                  {installment.name}
                                </Typography>
                              </Box>
                              <Typography variant="caption" fontWeight="medium">
                                {formatCurrency(installment.amount)}
                              </Typography>
                            </Box>
                          ))}
                        {projection.installments.length > 2 && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            +{projection.installments.length - 2} mais
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
                      sx={{ fontSize: "0.65rem" }}
                    >
                      Toque para ver detalhes
                    </Typography>
                  )}

                  {/* Visual indicator */}
                  <Box
                    sx={{
                      width: "100%",
                      height: "0.35rem",
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
      <Stack spacing={{ xs: 2, md: 4 }}>
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Skeleton
                variant="rectangular"
                height={96}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 3, md: 6 }}>
      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
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
                fontSize: { xs: "0.75rem", md: "0.875rem" },
              }}
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(totalCommitment)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.65rem" }}
              >
                Próximos {selectedMonths} + últimos {includePastMonths} meses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4 }}>
          <Card>
            <CardHeader
              title="Média Mensal"
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
                fontSize: { xs: "0.75rem", md: "0.875rem" },
              }}
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(averageCommitment)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.65rem" }}
              >
                Valor médio por mês
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4 }}>
          <Card>
            <CardHeader
              title="Maior Compromisso"
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
                fontSize: { xs: "0.75rem", md: "0.875rem" },
              }}
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(maxCommitment)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.65rem" }}
              >
                Mês com maior gasto
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Period Selector */}
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            Período futuro:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[6, 12, 24].map((months) => (
              <Button
                key={months}
                variant={selectedMonths === months ? "contained" : "outlined"}
                size="small"
                onClick={() => setSelectedMonths(months)}
                sx={{ minWidth: 70 }}
              >
                {months} meses
              </Button>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            Incluir histórico:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[0, 3, 6, 12].map((months) => (
              <Button
                key={months}
                variant={
                  includePastMonths === months ? "contained" : "outlined"
                }
                size="small"
                onClick={() => setIncludePastMonths(months)}
                sx={{ minWidth: 70 }}
              >
                {months === 0 ? "Nenhum" : `${months} meses`}
              </Button>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Tabs para separar por tipo */}
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{ borderBottom: 1, borderColor: "divider", mb: { xs: 2, md: 4 } }}
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
                  <Home style={{ width: "1rem", height: "1rem" }} />
                  <Typography
                    variant="body2"
                    sx={{ display: { xs: "none", sm: "block" } }}
                  >
                    Comprometimento
                  </Typography>
                  Fixo
                </Box>
              }
              value="fixed"
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CreditCard style={{ width: "1rem", height: "1rem" }} />
                  <Typography
                    variant="body2"
                    sx={{ display: { xs: "none", sm: "block" } }}
                  >
                    Comprometimento
                  </Typography>
                  Variável
                </Box>
              }
              value="variable"
            />
          </Tabs>
        </Box>

        {activeTab === "fixed" && (
          <Stack spacing={{ xs: 2, md: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: { xs: 1, md: 2 },
              }}
            >
              <Home
                style={{
                  width: "1rem",
                  height: "1rem",
                  color: theme.palette.info.main,
                }}
              />
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight="medium"
                  color="info.main"
                >
                  Compromissos Fixos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gastos recorrentes mensais
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
                    py: { xs: 4, md: 8 },
                  }}
                >
                  <Home
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
                    Nenhum compromisso fixo
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ px: 2 }}
                  >
                    Não há parcelamentos recorrentes previstos.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={{ xs: 3, md: 6 }}>
                {/* Card de resumo mensal dos gastos fixos */}
                <Card
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderColor: alpha(theme.palette.info.main, 0.2),
                  }}
                >
                  <CardContent sx={{ py: { xs: 2, md: 3 } }}>
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Home
                              style={{
                                width: "1rem",
                                height: "1rem",
                                color: theme.palette.info.main,
                              }}
                            />
                            <Typography variant="caption" color="info.main">
                              Impacto Mensal
                            </Typography>
                          </Box>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color="info.main"
                          >
                            {formatCurrency(totalMonthlyFixed)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="info.main"
                            sx={{ opacity: 0.8 }}
                          >
                            Compromisso fixo mensal
                          </Typography>
                          {salaryPercentage !== null && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={`${formatPercentage(
                                  salaryPercentage
                                )} do salário`}
                                variant="outlined"
                                size="small"
                                icon={
                                  <Percent
                                    style={{
                                      width: "0.65rem",
                                      height: "0.65rem",
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
                            </Box>
                          )}
                        </Box>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Lista dos gastos fixos individuais */}
                <Stack spacing={2}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    color="info.main"
                  >
                    Detalhamento:
                  </Typography>
                  <Stack spacing={1.5}>
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
                              <CardContent
                                sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}
                              >
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
                                      gap: 1.5,
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        p: 0.75,
                                        bgcolor: alpha(
                                          theme.palette.info.main,
                                          0.1
                                        ),
                                        borderRadius: 1,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <Repeat
                                        style={{
                                          width: "0.875rem",
                                          height: "0.875rem",
                                          color: theme.palette.info.main,
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                        noWrap
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
                                  <Box
                                    sx={{ textAlign: "right", flexShrink: 0 }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight="bold"
                                      color="info.main"
                                    >
                                      {formatCurrency(commitment.amount)}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ fontSize: "0.65rem" }}
                                    >
                                      por mês
                                    </Typography>
                                    {salaryPercentage !== null && (
                                      <Box sx={{ mt: 0.25 }}>
                                        <Chip
                                          label={formatPercentage(
                                            salaryPercentage
                                          )}
                                          variant="outlined"
                                          size="small"
                                          sx={{
                                            fontSize: "0.65rem",
                                            height: 18,
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
          <Stack spacing={{ xs: 2, md: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: { xs: 1, md: 2 },
              }}
            >
              <CreditCard
                style={{
                  width: "1rem",
                  height: "1rem",
                  color: theme.palette.success.main,
                }}
              />
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight="medium"
                  color="success.main"
                >
                  Compromissos Variáveis
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Parcelamentos com prazo definido
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
                    py: { xs: 4, md: 8 },
                  }}
                >
                  <CreditCard
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
                    Nenhum compromisso variável
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ px: 2 }}
                  >
                    Não há parcelamentos com prazo definido.
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
