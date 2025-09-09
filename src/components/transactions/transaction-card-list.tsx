
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
      <div className="text-center py-12 px-4 text-muted-foreground">
        <p className="text-base sm:text-lg">Nenhuma transação encontrada.</p>
        <p className="text-sm sm:text-base mt-2">Tente selecionar outro período ou filtro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
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
            await deleteTransaction(transaction);
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

      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={cn("p-1.5 sm:p-2 rounded-full shrink-0",
                transaction.type === 'income' ? 'bg-emerald-500/20' : 'bg-secondary'
              )}>
                {transaction.type === 'income' ? 
                  <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400"/> : 
                  <CategoryIcon category={transaction.category} className="h-4 w-4 sm:h-5 sm:w-5" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate">{transaction.item}</p>
                {transaction.establishment && (
                  <p className="text-xs text-muted-foreground truncate">{transaction.establishment}</p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
        
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className={cn("text-lg sm:text-xl font-bold", 
                transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
              )}>
                {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                {transaction.subcategory && (
                  <Badge variant="secondary" className="text-xs">{transaction.subcategory}</Badge>
                )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-3 sm:p-4 text-xs text-muted-foreground bg-muted/30 rounded-b-lg">
            <div className="flex items-center justify-between w-full">
              <span>{format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              {(transaction.quantity && transaction.quantity > 1) && (
                <span className="text-xs">Qtd: {transaction.quantity}</span>
              )}
            </div>
        </CardFooter>
      </Card>
    </>
  );
}
