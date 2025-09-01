import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CategoryIcon } from "../icons";
import { Transaction } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 7);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
        <CardDescription>Você tem {transactions.length} transações neste período.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {transactions.length > 0 ? (
            <ScrollArea className="flex-1">
                <div className="space-y-6 pr-4">
                {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-secondary border border-border text-foreground">
                                <CategoryIcon category={transaction.category} />
                            </AvatarFallback>
                        </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{transaction.item}</p>
                        <p className="text-sm text-muted-foreground">
                            {transaction.category}
                            {transaction.subcategory && ` / ${transaction.subcategory}`}
                        </p>
                    </div>
                    <div className="ml-auto font-medium text-right text-red-400">
                        -R$ {transaction.amount.toFixed(2)}
                    </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                <p>Nenhuma transação encontrada.</p>
                <p className="text-xs">Tente selecionar outra categoria ou período.</p>
            </div>
        )}
        <Button asChild variant="outline" className="mt-auto w-full">
            <Link href="/transactions">
                Ver Todas as Transações <ArrowRight className="ml-2 h-4 w-4"/>
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
