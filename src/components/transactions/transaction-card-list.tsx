
'use client';
import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { CategoryIcon } from '../icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical, Pen, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { EditTransactionSheet } from './edit-transaction-sheet';
import { useTransactions } from '@/hooks/use-transactions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TransactionCardListProps {
  transactions: Transaction[];
}

export function TransactionCardList({ transactions }: TransactionCardListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma transação encontrada.</p>
        <p className="text-sm">Tente selecionar outro período ou filtro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map(transaction => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { deleteTransaction } = useTransactions();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteTransaction(transaction.id);
            toast({ title: "Transação excluída com sucesso." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir transação." });
        }
    };

  return (
    <>
      <EditTransactionSheet 
          transaction={transaction} 
          isOpen={isEditSheetOpen} 
          setIsOpen={setIsEditSheetOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação "{transaction.item}".
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full",
                transaction.type === 'income' ? 'bg-emerald-500/20' : 'bg-secondary'
              )}>
                {transaction.type === 'income' ? 
                  <ArrowDown className="h-5 w-5 text-emerald-400"/> : 
                  <CategoryIcon category={transaction.category} className="h-5 w-5" />
                }
              </div>
              <div className="flex-1">
                <p className="font-semibold">{transaction.item}</p>
                {transaction.establishment && <p className="text-xs text-muted-foreground">{transaction.establishment}</p>}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
                  <Pen className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className={cn("text-lg font-bold", 
                transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
              )}>
                {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline">{transaction.category}</Badge>
                {transaction.subcategory && <Badge variant="secondary">{transaction.subcategory}</Badge>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 text-xs text-muted-foreground bg-muted/50 rounded-b-lg">
            {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </CardFooter>
      </Card>
    </>
  );
}
