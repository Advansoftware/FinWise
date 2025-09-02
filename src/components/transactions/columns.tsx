'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { CategoryIcon } from '../icons';

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'item',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('item')}</div>,
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const category = row.original.category;
      const subcategory = row.original.subcategory;
      return (
         <div className="flex flex-col gap-1">
            <Badge variant="outline" className="flex items-center gap-2 w-fit">
                <CategoryIcon category={category as any} className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{category}</span>
            </Badge>
            {subcategory && <Badge variant="secondary" className="w-fit">{subcategory}</Badge>}
        </div>
      );
    },
  },
    {
    accessorKey: 'quantity',
    header: () => <div className="text-center">Qtd.</div>,
    cell: ({ row }) => {
        const quantity = row.getValue('quantity');
        return <div className="text-center">{quantity ? String(quantity) : '1'}</div>
    }
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return <div className="text-left">{format(date, 'dd/MM/yyyy', { locale: ptBR })}</div>;
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className="text-right">
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                Valor
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);

      return <div className="text-right font-medium text-red-400">{formatted}</div>;
    },
  },
];
