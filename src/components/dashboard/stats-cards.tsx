import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { Transaction } from "@/lib/types";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

interface StatsCardsProps {
  transactions: Transaction[];
}

const generateSparklineData = (transactions: Transaction[]) => {
    if (transactions.length < 2) {
        const singleValue = transactions.length === 1 ? transactions[0].amount : 0;
        return [{ total: 0 }, { total: singleValue }];
    };

    const sorted = transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dailyTotals: {[key: string]: number} = {};

    sorted.forEach(t => {
        const date = t.date.split('T')[0];
        dailyTotals[date] = (dailyTotals[date] || 0) + (t.type === 'income' ? t.amount : -t.amount);
    });

    return Object.entries(dailyTotals).map(([date, total]) => ({ date, total }));
}

const ChartSparkline = ({ data, positiveColor, negativeColor }: { data: any[], positiveColor: string, negativeColor: string}) => {
    const isPositive = data.length > 0 && data[data.length-1].total >= 0;
    const colorId = isPositive ? "positiveSpark" : "negativeSpark";
    const strokeColor = isPositive ? positiveColor : negativeColor;

    return (
    <ResponsiveContainer width="100%" height={35}>
        <AreaChart data={data}>
            <defs>
                <linearGradient id={colorId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Tooltip
              cursor={false}
              contentStyle={{ 
                background: 'hsl(var(--background) / 0.8)',
                backdropFilter: 'blur(4px)',
                border: '1px solid hsl(var(--border))', 
                borderRadius: 'var(--radius)'
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
)};

export function StatsCards({ transactions }: StatsCardsProps) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const incomeTransactions = transactions.filter(t => t.type === 'income');

  const topCategoryMap = expenseTransactions
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  const topCategoryName = Object.keys(topCategoryMap).length > 0 
    ? Object.keys(topCategoryMap).reduce((a, b) => topCategoryMap[a] > topCategoryMap[b] ? a : b)
    : 'N/A';
  
  const topCategoryValue = topCategoryMap[topCategoryName] || 0;
  
  const balanceSparklineData = generateSparklineData(transactions);
  const incomeSparklineData = generateSparklineData(incomeTransactions);
  const expenseSparklineData = generateSparklineData(expenseTransactions);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4">
          <CardTitle className="text-xs font-medium">Balanço do Período</CardTitle>
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">R$ {(balance || 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Receitas vs Despesas no período</p>
           <div className="mt-2 h-[35px]">
             <ChartSparkline data={balanceSparklineData} positiveColor="hsl(var(--primary))" negativeColor="hsl(var(--destructive))" />
           </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4">
          <CardTitle className="text-xs font-medium">Total de Receitas</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold text-emerald-500">+ R$ {(totalIncome || 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total de entradas no período</p>
           <div className="mt-2 h-[35px]">
             <ChartSparkline data={incomeSparklineData} positiveColor="hsl(var(--chart-2))" negativeColor="hsl(var(--chart-2))" />
           </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4">
          <CardTitle className="text-xs font-medium">Total de Despesas</CardTitle>
          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
           <div className="text-xl font-bold text-red-500">- R$ {(totalExpense || 0).toFixed(2)}</div>
           <p className="text-xs text-muted-foreground">Total de saídas no período</p>
           <div className="mt-2 h-[35px]">
              <ChartSparkline data={expenseSparklineData} positiveColor="hsl(var(--destructive))" negativeColor="hsl(var(--destructive))" />
           </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4">
          <CardTitle className="text-xs font-medium">Categoria Principal</CardTitle>
          <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">R$ {(topCategoryValue || 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground truncate">{topCategoryName}</p>
          <div className="mt-2 flex items-center">
            <div className="text-xs text-muted-foreground">
              {transactions.length > 0 ? `${Math.round((topCategoryValue / totalExpense) * 100)}% do total` : 'Sem dados'}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
