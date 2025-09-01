import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet, Package, TrendingDown } from "lucide-react";
import { Transaction } from "@/lib/types";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface StatsCardsProps {
  transactions: Transaction[];
}

const generateSparklineData = (transactions: Transaction[]) => {
    if (transactions.length < 2) return [];

    const sorted = transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dailyTotals: {[key: string]: number} = {};

    sorted.forEach(t => {
        const date = t.date.split('T')[0];
        dailyTotals[date] = (dailyTotals[date] || 0) + t.amount;
    });

    return Object.entries(dailyTotals).map(([date, total]) => ({ date, total }));
}

const ChartSparkline = ({ data, positive = false }: { data: any[], positive?: boolean}) => (
    <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data}>
            <defs>
                <linearGradient id={positive ? "colorPositive" : "colorNegative"} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={positive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={positive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Area 
                type="monotone" 
                dataKey="total" 
                stroke={positive ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#${positive ? "colorPositive" : "colorNegative"})`}
            />
        </AreaChart>
    </ResponsiveContainer>
);

export function StatsCards({ transactions }: StatsCardsProps) {
  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);

  const topCategoryMap = transactions
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  const topCategoryName = Object.keys(topCategoryMap).length > 0 
    ? Object.keys(topCategoryMap).reduce((a, b) => topCategoryMap[a] > topCategoryMap[b] ? a : b)
    : 'N/A';
  
  const topCategoryValue = topCategoryMap[topCategoryName] || 0;

  const leastCategoryName = Object.keys(topCategoryMap).length > 0
    ? Object.keys(topCategoryMap).reduce((a, b) => topCategoryMap[a] < topCategoryMap[b] ? a : b)
    : 'N/A';
  const leastCategoryValue = topCategoryMap[leastCategoryName] || 0;
  
  const sparklineData = generateSparklineData(transactions);


  return (
    <>
      <Card className="bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gasto no Período</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {totalSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Soma das transações filtradas</p>
           <div className="mt-2">
             <ChartSparkline data={sparklineData} />
           </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Principal Categoria</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{topCategoryName}</div>
          <div className="text-lg font-semibold text-primary">R$ {topCategoryValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Sua maior área de despesa</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Menor Categoria</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{leastCategoryName}</div>
           <div className="text-lg font-semibold text-green-400">R$ {leastCategoryValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Sua menor área de despesa</p>
        </CardContent>
      </Card>
    </>
  );
}
