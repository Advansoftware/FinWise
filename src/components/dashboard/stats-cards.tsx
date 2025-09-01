import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beer, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { Transaction } from "@/lib/types";

interface StatsCardsProps {
  transactions: Transaction[];
}

export function StatsCards({ transactions }: StatsCardsProps) {
  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  const thisMonthSpending = totalSpending; 

  const topCategory = transactions
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  const topCategoryName = Object.keys(topCategory).length > 0 
    ? Object.keys(topCategory).reduce((a, b) => topCategory[a] > topCategory[b] ? a : b)
    : 'N/A';

  const beerSpending = topCategory['Cerveja'] || 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {totalSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">+20.1% do último mês</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {thisMonthSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Gasto atual para o período</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Principal Categoria</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topCategoryName}</div>
          <p className="text-xs text-muted-foreground">Sua maior área de despesa</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Índice Cerveja</CardTitle>
          <Beer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {beerSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Valor gasto com cerveja</p>
        </CardContent>
      </Card>
    </>
  );
}
