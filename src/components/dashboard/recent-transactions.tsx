import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockTransactions } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CategoryIcon } from "../icons";

export function RecentTransactions() {
  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>You made {mockTransactions.length} transactions this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted">
                        <CategoryIcon category={transaction.category} />
                    </AvatarFallback>
                </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{transaction.item}</p>
                <p className="text-sm text-muted-foreground">{transaction.category}</p>
              </div>
              <div className="ml-auto font-medium text-right">
                -${transaction.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
