"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SpendingChartProps {
  data: { name: string; total: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Visão Geral dos Gastos</CardTitle>
        <CardDescription>Sua atividade de gastos para o período selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
             <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                </linearGradient>
            </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--chart-2))', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ 
                background: 'hsl(var(--background) / 0.8)',
                backdropFilter: 'blur(4px)',
                border: '1px solid hsl(var(--border))', 
                borderRadius: 'var(--radius)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => [`R$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Area dataKey="total" type="monotone" fill="url(#colorTotal)" stroke="hsl(var(--chart-2))" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
