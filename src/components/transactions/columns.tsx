'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { CategoryIcon } from '../icons';
import { Checkbox } from '../ui/checkbox';

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
    cell: ({ row }) => <div className="font-medium">{row.getValue('item')}</div>,
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
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);

      return <div className="text-right font-medium text-red-400/90 whitespace-nowrap">{formatted}</div>;
    },
    size: 50,
  },
];
