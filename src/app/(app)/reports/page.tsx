// src/app/(app)/reports/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useReports } from "@/hooks/use-reports";
import { useTransactions } from "@/hooks/use-transactions";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  Button,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { getYear } from "date-fns";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/mui-wrappers/tabs";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";
import { usePlan } from "@/hooks/use-plan";
import { Report } from "@/core/ports/reports.port";

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function ReportsPage() {
  const { allTransactions, isLoading: isTransactionsLoading } =
    useTransactions();
  const { isPro, isLoading: isPlanLoading } = usePlan();

  const availableYears = useMemo(() => {
    const years = new Set(
      allTransactions.map((t) => getYear(new Date(t.date)))
    );
    const currentYear = getYear(new Date());
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [allTransactions]);

  if (isTransactionsLoading || isPlanLoading) {
    return (
      <Stack spacing={4} sx={{ p: { xs: 2, md: 4 } }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", md: "1.875rem" },
              fontWeight: "bold",
              letterSpacing: "-0.025em",
            }}
          >
            Relatórios
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: "0.875rem", md: "1rem" },
              color: "text.secondary",
            }}
          >
            Analise seus fechamentos mensais e anuais
          </Typography>
        </Box>
        <Skeleton
          variant="rectangular"
          height={32}
          width={128}
          sx={{ borderRadius: 1 }}
        />
        <Skeleton variant="rectangular" height={192} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }

  if (!isPro) {
    return <ProUpgradeCard featureName="Relatórios Inteligentes" />;
  }

  return (
    <Stack spacing={4} sx={{ p: { xs: 2, md: 4 } }}>
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", md: "1.875rem" },
            fontWeight: "bold",
            letterSpacing: "-0.025em",
          }}
        >
          Relatórios
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: "0.875rem", md: "1rem" },
            color: "text.secondary",
          }}
        >
          Relatórios mensais e anuais gerados automaticamente pela IA
        </Typography>
      </Box>

      <Tabs defaultValue={String(getYear(new Date()))}>
        <TabsList
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            width: { xs: "100%", md: "auto" },
            bgcolor: "background.paper",
          }}
        >
          {availableYears.slice(0, 4).map((year) => (
            <TabsTrigger
              key={year}
              value={String(year)}
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              {year}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableYears.map((year) => (
          <TabsContent key={year} value={String(year)} sx={{ mt: 4 }}>
            <YearlyReportView year={year} />
          </TabsContent>
        ))}
      </Tabs>
    </Stack>
  );
}

function YearlyReportView({ year }: { year: number }) {
  const { getAnnualReport, isLoading: isReportsLoading } = useReports();

  const annualReport = useMemo(
    () => getAnnualReport(year),
    [year, getAnnualReport]
  );

  if (isReportsLoading) return <ReportsSkeleton />;

  if (annualReport) {
    return <AnnualReportDisplay report={annualReport} />;
  }

  return (
    <Tabs defaultValue="monthly">
      <TabsList
        sx={{
          display: "grid",
          width: "100%",
          gridTemplateColumns: "repeat(2, 1fr)",
          bgcolor: "background.paper",
        }}
      >
        <TabsTrigger
          value="monthly"
          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
        >
          Visão Mensal
        </TabsTrigger>
        <TabsTrigger
          value="annual"
          disabled
          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, opacity: 0.5 }}
        >
          Visão Anual (Pendente)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="monthly" sx={{ mt: 4 }}>
        <MonthlyReportsGrid year={year} />
      </TabsContent>

      <TabsContent value="annual" sx={{ mt: 4 }}>
        <Card>
          <CardContent
            sx={{
              p: { xs: 3, md: 4 },
              textAlign: "center",
              color: "text.secondary",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              component={Calendar}
              sx={{
                height: { xs: 32, md: 48 },
                width: { xs: 32, md: 48 },
                mb: { xs: 1.5, md: 2 },
                color: "primary.main",
                opacity: 0.5,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: "1rem", md: "1.125rem" },
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Relatório Anual de {year} Pendente
            </Typography>
            <Typography
              variant="body2"
              sx={{ maxWidth: "md", mx: "auto", mt: 1 }}
            >
              O relatório anual será gerado automaticamente quando houver pelo
              menos 6 relatórios mensais.
            </Typography>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function MonthlyReportsGrid({ year }: { year: number }) {
  const availableMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
          xl: "repeat(6, 1fr)",
        },
        gap: { xs: 1.5, md: 2 },
      }}
    >
      {availableMonths.map((month) => (
        <MonthlyReportCard key={month} year={year} month={month} />
      ))}
    </Box>
  );
}

function MonthlyReportCard({ year, month }: { year: number; month: number }) {
  const { getMonthlyReport, generateMonthlyReport } = useReports();
  const [isGenerating, setIsGenerating] = useState(false);
  const report = getMonthlyReport(year, month);
  const monthName = new Date(0, month - 1).toLocaleString("pt-BR", {
    month: "short",
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await generateMonthlyReport(year, month, true);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (report) {
    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <CardHeader
          sx={{ pb: 1, p: { xs: 1.5, md: 2 } }}
          title={
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: "0.875rem", md: "1rem" },
                textTransform: "capitalize",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {monthName}
            </Typography>
          }
          subheader={
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                fontWeight: 500,
                color: report.data.balance >= 0 ? "success.main" : "error.main",
              }}
            >
              {report.data.balance.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Typography>
          }
        />
        <CardContent sx={{ fontSize: "0.75rem", p: { xs: 1.5, md: 2 }, pt: 0 }}>
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ color: "success.main" }}
            >
              <Box
                component={TrendingUp}
                sx={{ height: 12, width: 12, flexShrink: 0 }}
              />
              <Typography
                variant="caption"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {report.data.totalIncome.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Typography>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ color: "error.main" }}
            >
              <Box
                component={TrendingDown}
                sx={{ height: 12, width: 12, flexShrink: 0 }}
              />
              <Typography
                variant="caption"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {report.data.totalExpense.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        height: "100%",
        minHeight: { xs: 120, md: 140 },
        bgcolor: "action.hover",
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            fontSize: { xs: "0.875rem", md: "1rem" },
            textTransform: "capitalize",
          }}
        >
          {monthName}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{ color: "text.secondary", fontSize: "0.75rem", mt: 1 }}
        >
          <Box component={Clock} sx={{ height: 12, width: 12 }} />
          <Typography variant="caption">Pendente</Typography>
        </Stack>
        <Button
          variant="text"
          size="small"
          sx={{ height: 28, fontSize: "0.75rem", mt: 1 }}
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <CircularProgress size={12} />
          ) : (
            <Box component={RefreshCw} sx={{ height: 12, width: 12 }} />
          )}
          <Box
            component="span"
            sx={{ ml: 0.5, display: { xs: "none", md: "inline" } }}
          >
            Gerar
          </Box>
        </Button>
      </Box>
    </Card>
  );
}

function AnnualReportDisplay({ report }: { report: Report }) {
  const chartData = report.data.topCategories.slice(0, 5).map((cat) => ({
    name: cat.category,
    value: cat.amount,
  }));

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <StatCard
          icon={TrendingUp}
          title="Total Receitas"
          value={report.data.totalIncome}
          color="success.main"
        />
        <StatCard
          icon={TrendingDown}
          title="Total Despesas"
          value={report.data.totalExpense}
          color="error.main"
        />
        <StatCard
          icon={DollarSign}
          title="Balanço Final"
          value={report.data.balance}
          color={report.data.balance >= 0 ? "success.main" : "error.main"}
        />
      </Box>

      {/* Charts Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* Pie Chart */}
        <Card>
          <CardHeader
            sx={{ pb: 1.5, p: { xs: 2, md: 3 } }}
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  component={BarChart2}
                  sx={{
                    color: "primary.main",
                    height: { xs: 16, md: 20 },
                    width: { xs: 16, md: 20 },
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", md: "1.125rem" } }}
                >
                  Top 5 Categorias
                </Typography>
              </Stack>
            }
            subheader={
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  color: "text.secondary",
                }}
              >
                Maiores gastos do ano
              </Typography>
            }
          />
          <CardContent sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
            <Box sx={{ height: { xs: 192, md: 256 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="60%"
                    fill="#8884d8"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend iconSize={6} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader
            sx={{ pb: 1.5, p: { xs: 2, md: 3 } }}
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  component={BarChart2}
                  sx={{
                    color: "primary.main",
                    height: { xs: 16, md: 20 },
                    width: { xs: 16, md: 20 },
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: "1rem", md: "1.125rem" } }}
                >
                  Breakdown por Categoria
                </Typography>
              </Stack>
            }
            subheader={
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  color: "text.secondary",
                }}
              >
                Distribuição de gastos
              </Typography>
            }
          />
          <CardContent sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
            <Box sx={{ height: { xs: 192, md: 256 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number) => [
                      value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                      "Valor",
                    ]}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* AI Summary */}
      <Card>
        <CardHeader
          sx={{ p: { xs: 2, md: 3 } }}
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                component={Sparkles}
                sx={{
                  color: "primary.main",
                  height: { xs: 16, md: 20 },
                  width: { xs: 16, md: 20 },
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", md: "1.125rem" } }}
              >
                Resumo Anual da IA
              </Typography>
            </Stack>
          }
        />
        <CardContent sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: "0.875rem", md: "1rem" },
              color: "text.secondary",
              whiteSpace: "pre-wrap",
              lineHeight: 1.75,
            }}
          >
            {report.data.summary}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: any;
  title: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardHeader
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          p: { xs: 1.5, md: 2 },
        }}
        title={
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
        }
        action={<Box component={Icon} sx={{ height: 16, width: 16, color }} />}
      />
      <CardContent sx={{ p: { xs: 1.5, md: 2 }, pt: 0 }}>
        <Typography
          sx={{
            fontSize: { xs: "1.125rem", md: "1.5rem" },
            fontWeight: "bold",
            color,
          }}
        >
          {value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ReportsSkeleton() {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      {/* Stats Cards Skeleton */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <Skeleton
          variant="rectangular"
          sx={{ borderRadius: 2, height: { xs: 80, md: 112 } }}
        />
        <Skeleton
          variant="rectangular"
          sx={{ borderRadius: 2, height: { xs: 80, md: 112 } }}
        />
        <Skeleton
          variant="rectangular"
          sx={{ borderRadius: 2, height: { xs: 80, md: 112 } }}
        />
      </Box>

      {/* Charts Skeleton */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          gap: { xs: 2, md: 3 },
        }}
      >
        <Skeleton
          variant="rectangular"
          sx={{ borderRadius: 2, height: { xs: 192, md: 256 } }}
        />
        <Skeleton
          variant="rectangular"
          sx={{ borderRadius: 2, height: { xs: 192, md: 256 } }}
        />
      </Box>

      {/* Summary Skeleton */}
      <Skeleton
        variant="rectangular"
        sx={{ borderRadius: 2, height: { xs: 96, md: 128 } }}
      />
    </Stack>
  );
}
