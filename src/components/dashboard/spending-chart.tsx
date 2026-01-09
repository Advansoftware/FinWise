"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";

interface SpendingChartProps {
  data: { name: string; total: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: "blur(4px)",
      }}
    >
      <CardHeader
        title={<Typography variant="h6">Visão Geral dos Gastos</Typography>}
        subheader={
          <Typography variant="body2" color="text.secondary">
            Sua atividade de gastos para o período selecionado.
          </Typography>
        }
      />
      <CardContent sx={{ pl: 0 }}>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette.secondary.main}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette.secondary.main}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={alpha(theme.palette.divider, 0.5)}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip
              cursor={{
                stroke: theme.palette.secondary.main,
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                background: theme.palette.background.paper,
                backdropFilter: "blur(8px)",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[4],
              }}
              labelStyle={{
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
              itemStyle={{ color: theme.palette.text.primary }}
              formatter={(value: number, name: string) => [
                <span
                  key="value"
                  style={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  R${value.toFixed(2)}
                </span>,
                "Total",
              ]}
            />
            <Area
              dataKey="total"
              type="monotone"
              fill="url(#colorTotal)"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
