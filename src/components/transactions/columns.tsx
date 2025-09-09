
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction, Wallet } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, MoreHorizontal, Pen, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { CategoryIcon } from '../icons';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useTransactions } from '@/hooks/use-transactions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { EditTransactionSheet } from './edit-transaction-sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import { useWallets } from '@/hooks/use-wallets';

const ActionsCell = ({ row }: { row: any }) => {
    const transaction = row.original as Transaction;
    const { deleteTransaction } = useTransactions();
    const { toast } = useToast();
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
                    <Pen className="mr-2 h-4 w-4" />
                    Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500 focus:text-red-400 focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
};

const WalletCell = ({ row }: { row: any}) => {
    const { wallets } = useWallets();
    const wallet = wallets.find(w => w.id === row.original.walletId);
    return wallet ? <div className="text-xs text-muted-foreground whitespace-nowrap">{wallet.name}</div> : null;
}


export const columns: ColumnDef<Transaction>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 20,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 h-8"
        >
          <span>Data</span>
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return <div className="text-left text-xs whitespace-nowrap">{format(date, 'dd/MM/yy', { locale: ptBR })}</div>;
    },
    size: 50,
  },
  {
    accessorKey: 'item',
    header: 'Item',
    cell: ({ row }) => {
      const establishment = row.original.establishment;
      const type = row.original.type;
      return (
        <div className="flex items-center gap-2">
           {type === 'income' ? <ArrowDown className="text-emerald-500 h-4 w-4"/> : <ArrowUp className="text-red-500 h-4 w-4"/>}
          <div>
            <div className="font-medium">{row.getValue('item')}</div>
            {establishment && <div className="text-xs text-muted-foreground">{establishment}</div>}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'walletId',
    header: 'Carteira',
    cell: WalletCell,
    size: 100,
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const category = row.original.category;
      return (
         <Badge variant="outline" className="flex items-center justify-center gap-1.5 w-fit font-normal">
            <CategoryIcon category={category as any} className="h-3 w-3" />
            <span className="capitalize">{category}</span>
        </Badge>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'subcategory',
    header: 'Subcategoria',
    cell: ({ row }) => {
      const subcategory = row.original.subcategory;
      return subcategory ? <Badge variant="secondary" className="w-fit font-normal">{subcategory}</Badge> : <span className="text-muted-foreground">-</span>
    },
    size: 100,
  },
  {
    accessorKey: 'quantity',
    header: () => <div className="text-center">Qtd.</div>,
    cell: ({ row }) => {
        const quantity = row.getValue('quantity');
        return <div className="text-center">{quantity ? String(quantity) : '1'}</div>
    },
    size: 20,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className="text-right">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 -mr-4"
                >
                <span>Valor</span>
                <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const type = row.original.type;

      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);

      return (
        <div className={cn("text-right font-medium whitespace-nowrap",
          type === 'income' ? 'text-emerald-500' : 'text-red-500/90'
        )}>
          {type === 'income' ? '+' : '-'} {formatted}
        </div>
      );
    },
    size: 50,
  },
  {
    id: 'actions',
    cell: ActionsCell,
    size: 40,
  },
];
