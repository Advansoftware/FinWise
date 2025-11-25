import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  useTheme,
  Grid,
} from "@mui/material";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Wallet,
} from "lucide-react";
import { Transaction } from "@/lib/types";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

interface StatsCardsProps {
  transactions: Transaction[];
}

const generateSparklineData = (transactions: Transaction[]) => {
  if (transactions.length < 2) {
    const singleValue = transactions.length === 1 ? transactions[0].amount : 0;
    return [{ total: 0 }, { total: singleValue }];
  }

  const sorted = transactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const dailyTotals: { [key: string]: number } = {};

  sorted.forEach((t) => {
    const date = t.date.split("T")[0];
    dailyTotals[date] =
      (dailyTotals[date] || 0) + (t.type === "income" ? t.amount : -t.amount);
  });

  return Object.entries(dailyTotals).map(([date, total]) => ({ date, total }));
};

const ChartSparkline = ({
  data,
  positiveColor,
  negativeColor,
}: {
  data: any[];
  positiveColor: string;
  negativeColor: string;
}) => {
  const isPositive = data.length > 0 && data[data.length - 1].total >= 0;
  const colorId = isPositive ? "positiveSpark" : "negativeSpark";
  const strokeColor = isPositive ? positiveColor : negativeColor;

  return (
    <ResponsiveContainer width="100%" height={35}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={colorId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={false}
          contentStyle={{
            background: "hsl(var(--background) / 0.8)",
            backdropFilter: "blur(4px)",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke={strokeColor}
          strokeWidth={1.5}
          fillOpacity={1}
          fill={`url(#${colorId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export function StatsCards({ transactions }: StatsCardsProps) {
  const theme = useTheme();
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseTransactions = transactions.filter((t) => t.type === "expense");
  const incomeTransactions = transactions.filter((t) => t.type === "income");

  const topCategoryMap = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategoryName =
    Object.keys(topCategoryMap).length > 0
      ? Object.keys(topCategoryMap).reduce((a, b) =>
          topCategoryMap[a] > topCategoryMap[b] ? a : b
        )
      : "N/A";

  const topCategoryValue = topCategoryMap[topCategoryName] || 0;

  const balanceSparklineData = generateSparklineData(transactions);
  const incomeSparklineData = generateSparklineData(incomeTransactions);
  const expenseSparklineData = generateSparklineData(expenseTransactions);

  // Calcular taxa de economia
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const isPositiveSavings = savingsRate >= 0;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title={
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="subtitle2" fontWeight="medium">
                  Balanço do Período
                </Typography>
                <DollarSign
                  style={{
                    width: 14,
                    height: 14,
                    color: theme.palette.text.secondary,
                  }}
                />
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h5" fontWeight="bold">
              R$ {(balance || 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Receitas vs Despesas no período
            </Typography>
            <Box sx={{ mt: 2, height: 35 }}>
              <ChartSparkline
                data={balanceSparklineData}
                positiveColor={theme.palette.primary.main}
                negativeColor={theme.palette.error.main}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title={
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="subtitle2" fontWeight="medium">
                  Total de Receitas
                </Typography>
                <TrendingUp
                  style={{
                    width: 14,
                    height: 14,
                    color: theme.palette.success.main,
                  }}
                />
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              + R$ {(totalIncome || 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total de entradas no período
            </Typography>
            <Box sx={{ mt: 2, height: 35 }}>
              <ChartSparkline
                data={incomeSparklineData}
                positiveColor={theme.palette.success.main}
                negativeColor={theme.palette.success.main}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title={
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="subtitle2" fontWeight="medium">
                  Total de Despesas
                </Typography>
                <TrendingDown
                  style={{
                    width: 14,
                    height: 14,
                    color: theme.palette.error.main,
                  }}
                />
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h5" fontWeight="bold" color="error.main">
              - R$ {(totalExpense || 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total de saídas no período
            </Typography>
            <Box sx={{ mt: 2, height: 35 }}>
              <ChartSparkline
                data={expenseSparklineData}
                positiveColor={theme.palette.error.main}
                negativeColor={theme.palette.error.main}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ height: "100%" }}>
          <CardHeader
            title={
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="subtitle2" fontWeight="medium">
                  Taxa de Economia
                </Typography>
                <Wallet
                  style={{
                    width: 14,
                    height: 14,
                    color: theme.palette.text.secondary,
                  }}
                />
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              color={isPositiveSavings ? "success.main" : "error.main"}
            >
              {isPositiveSavings ? "+" : ""}
              {savingsRate.toFixed(1)}%
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {isPositiveSavings
                ? "Você está economizando!"
                : "Gastos excedem receitas"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {isPositiveSavings
                ? `R$ ${(totalIncome - totalExpense).toFixed(2)} guardados`
                : `R$ ${Math.abs(totalIncome - totalExpense).toFixed(
                    2
                  )} em déficit`}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
