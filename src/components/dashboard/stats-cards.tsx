import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet, Package } from "lucide-react";
import { Transaction } from "@/lib/types";

interface StatsCardsProps {
  transactions: Transaction[];
  selectedItem: string;
}

export function StatsCards({ transactions, selectedItem }: StatsCardsProps) {
  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  const thisMonthSpending = totalSpending; 

  const topCategoryMap = transactions
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  const topCategoryName = Object.keys(topCategoryMap).length > 0 
    ? Object.keys(topCategoryMap).reduce((a, b) => topCategoryMap[a] > topCategoryMap[b] ? a : b)
    : 'N/A';
  
  const selectedItemSpending = transactions
    .filter(t => t.item === selectedItem)
    .reduce((sum, t) => sum + t.amount, 0);

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
          <CardTitle className="text-sm font-medium">Gasto no Período</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {thisMonthSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Soma das transações filtradas</p>
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
          <CardTitle className="text-sm font-medium">Gasto com {selectedItem}</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {selectedItemSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Valor gasto no item selecionado</p>
        </CardContent>
      </Card>
    </>
  );
}
