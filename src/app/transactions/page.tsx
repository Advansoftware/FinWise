'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockTransactions } from '@/lib/data';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CategoryIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

const categoryColors: Record<string, string> = {
    Supermercado: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Transporte: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    Entretenimento: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Contas: 'bg-red-500/20 text-red-300 border-red-500/30',
    Cerveja: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Restaurante: 'bg-green-500/20 text-green-300 border-green-500/30',
    Saúde: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
}


export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Transações</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Aqui está a lista de todas as suas transações registradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell>{transaction.item}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoryColors[transaction.category] || ''}>
                      <CategoryIcon category={transaction.category} className="mr-1 h-3 w-3" />
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">-R$ {transaction.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
