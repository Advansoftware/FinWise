import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockTransactions } from "@/lib/data";
import { Beer, DollarSign, TrendingUp, Wallet } from "lucide-react";

export function StatsCards() {
  const totalSpending = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const thisMonthSpending = totalSpending; // Placeholder logic
  const topCategory = mockTransactions
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  const topCategoryName = Object.keys(topCategory).reduce((a, b) => topCategory[a] > topCategory[b] ? a : b, 'None');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${thisMonthSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Current spending for July</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topCategoryName}</div>
          <p className="text-xs text-muted-foreground">Your biggest expense area</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Beer Index</CardTitle>
          <Beer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(topCategory['Beer'] || 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Amount spent on beer this month</p>
        </CardContent>
      </Card>
    </>
  );
}
