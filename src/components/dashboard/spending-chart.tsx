"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SpendingChartProps {
  data: { name: string; total: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <Card className="h-full bg-gradient-to-br from-card to-muted/30">
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
        <CardDescription>Visão geral dos seus gastos no período selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
             <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                </linearGradient>
            </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
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
              cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
              contentStyle={{ 
                background: 'hsl(var(--background) / 0.8)',
                backdropFilter: 'blur(4px)',
                border: '1px solid hsl(var(--border))', 
                borderRadius: 'var(--radius)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => [`R$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Bar dataKey="total" fill="url(#colorTotal)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
