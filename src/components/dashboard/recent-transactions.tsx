import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CategoryIcon } from "../icons";
import { Transaction } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Box, Stack, Typography } from '@mui/material';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 7);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
        <CardDescription>Você tem {transactions.length} movimentações neste período.</CardDescription>
      </CardHeader>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {transactions.length > 0 ? (
            <ScrollArea sx={{ flex: 1 }}>
                <Stack spacing={2} sx={{ pr: 2 }}>
                {recentTransactions.map((transaction) => (
                    <Stack key={transaction.id} direction="row" alignItems="flex-start" spacing={1.5}>
                        <Avatar sx={{ width: 32, height: 32, flexShrink: 0 }}>
                            <AvatarFallback 
                              sx={{
                                bgcolor: 'var(--secondary)',
                                border: '1px solid var(--border)',
                                color: 'var(--foreground)',
                                ...(transaction.type === 'income' && {
                                  bgcolor: 'rgba(16, 185, 129, 0.2)',
                                  color: '#10b981',
                                  borderColor: 'rgba(16, 185, 129, 0.3)',
                                }),
                                ...(transaction.type === 'expense' && {
                                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                                  color: '#ef4444',
                                  borderColor: 'rgba(239, 68, 68, 0.3)',
                                })
                              }}
                            >
                                {transaction.type === 'income' ? <ArrowDown style={{ width: '0.75rem', height: '0.75rem' }}/> : <ArrowUp style={{ width: '0.75rem', height: '0.75rem' }}/>}
                            </AvatarFallback>
                        </Avatar>
                    <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {transaction.item}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {transaction.category}
                            {transaction.subcategory && ` / ${transaction.subcategory}`}
                        </Typography>
                    </Stack>
                    <Typography 
                      sx={{ 
                        flexShrink: 0, 
                        fontWeight: 500, 
                        textAlign: 'right', 
                        fontSize: '0.875rem',
                        color: transaction.type === 'income' ? '#10b981' : '#ef4444'
                      }}
                    >
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </Typography>
                    </Stack>
                ))}
                </Stack>
            </ScrollArea>
        ) : (
            <Stack 
              spacing={0.5}
              sx={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center', 
                color: 'var(--muted-foreground)' 
              }}
            >
                <Typography>Nenhuma transação encontrada.</Typography>
                <Typography sx={{ fontSize: '0.75rem' }}>Tente selecionar outra categoria ou período.</Typography>
            </Stack>
        )}
        <Button asChild variant="outline" sx={{ mt: 'auto', width: '100%' }}>
            <Link href="/transactions">
                Ver Todas as Transações <ArrowRight style={{ marginLeft: '0.5rem', width: '1rem', height: '1rem' }}/>
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
