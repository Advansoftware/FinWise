
'use client';

import {ColumnDef} from '@tanstack/react-table';
import {Transaction, Wallet} from '@/lib/types';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {Chip, Typography, Button, Box, Stack} from '@mui/material';
import {ArrowUpDown, MoreHorizontal, Pen, Trash2, ArrowUp, ArrowDown} from 'lucide-react';
import {CategoryIcon} from '../icons';
import {Checkbox} from '@mui/material';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/mui-wrappers/dropdown-menu';
import {useTransactions} from '@/hooks/use-transactions';
import {useToast} from '@/hooks/use-toast';
import {useState} from 'react';
import {EditTransactionSheet} from './edit-transaction-sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/mui-wrappers/alert-dialog"
import {useWallets} from '@/hooks/use-wallets';

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
            toast({ variant: "error", title: "Erro ao excluir transação." });
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
                    <AlertDialogAction onClick={handleDelete} sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="text" sx={{ height: '2rem', width: '2rem', p: 0 }}>
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal style={{ width: '1rem', height: '1rem' }} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
                    <Pen style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                    Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} sx={{ color: 'error.main', '&:focus': { color: 'error.light', bgcolor: 'error.main', opacity: 0.1 } }}>
                    <Trash2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
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
    return wallet ? <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{wallet.name}</Typography> : null;
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
        sx={{ transform: 'translateY(2px)' }}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        sx={{ transform: 'translateY(2px)' }}
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
          variant="text"
          size="small"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          sx={{ ml: -3, height: '2rem' }}
        >
          <span>Data</span>
          <ArrowUpDown style={{ marginLeft: '0.5rem', width: '0.75rem', height: '0.75rem' }} />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return <Typography variant="body2" sx={{ textAlign: 'left', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{format(date, 'dd/MM/yy', { locale: ptBR })}</Typography>;
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
        <Stack direction="row" alignItems="center" spacing={2}>
           {type === 'income' ? <ArrowDown style={{ color: '#10b981', width: '1rem', height: '1rem' }} /> : <ArrowUp style={{ color: '#ef4444', width: '1rem', height: '1rem' }} />}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.getValue('item')}</Typography>
            {establishment && <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{establishment}</Typography>}
          </Box>
        </Stack>
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
         <Chip variant="outlined" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, width: 'fit-content', fontWeight: 400 }}>
            <CategoryIcon category={category as any} className="h-3 w-3" />
            <span style={{ textTransform: 'capitalize' }}>{category}</span>
        </Chip>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'subcategory',
    header: 'Subcategoria',
    cell: ({ row }) => {
      const subcategory = row.original.subcategory;
      return subcategory ? <Chip variant="contained" color="secondary" sx={{ width: 'fit-content', fontWeight: 400 }}>{subcategory}</Chip> : <Typography component="span" sx={{ color: 'text.secondary' }}>-</Typography>
    },
    size: 100,
  },
  {
    accessorKey: 'quantity',
    header: () => <Typography sx={{ textAlign: 'center' }}>Qtd.</Typography>,
    cell: ({ row }) => {
        const quantity = row.getValue('quantity');
        return <Typography sx={{ textAlign: 'center' }}>{quantity ? String(quantity) : '1'}</Typography>
    },
    size: 20,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Box sx={{ textAlign: 'right' }}>
            <Button
                variant="text"
                size="small"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                sx={{ height: '2rem', mr: -4 }}
                >
                <span>Valor</span>
                <ArrowUpDown style={{ marginLeft: '0.5rem', width: '0.75rem', height: '0.75rem' }} />
            </Button>
        </Box>
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
        <Typography sx={{ 
          textAlign: 'right', 
          fontWeight: 500, 
          whiteSpace: 'nowrap',
          color: type === 'income' ? '#10b981' : 'rgba(239, 68, 68, 0.9)'
        }}>
          {type === 'income' ? '+' : '-'} {formatted}
        </Typography>
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
