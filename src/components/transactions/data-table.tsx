
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { AnalyzeTransactionsDialog } from './analyze-transactions-dialog';
import { Box, Stack } from '@mui/material';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([
      { id: 'date', desc: true } // Ordenação inicial por data decrescente
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
          sorting,
          columnFilters,
          rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            }
        }
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 4 }}>
        <Input
          placeholder="Filtrar por item..."
          value={(table.getColumn("item")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("item")?.setFilterValue(event.target.value)
          }
          sx={{ maxWidth: '24rem' }}
        />
        {selectedRows.length > 0 && (
          <AnalyzeTransactionsDialog transactions={selectedRows as any} />
        )}
      </Stack>
      <Box sx={{ overflowX: 'auto' }}>
        <Table>
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                    return (
                    <TableHead key={header.id} sx={{ p: 2 }} style={{width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined}}>
                        {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                            )}
                    </TableHead>
                    );
                })}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    sx={{ height: '3rem' }}
                >
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} sx={{ p: 2 }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} sx={{ height: '6rem', textAlign: 'center' }}>
                    Nenhum resultado encontrado.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </Box>
       <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={2} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ flex: 1, fontSize: '0.875rem', color: 'text.secondary', px: 2 }}>
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionadas.
        </Box>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </Stack>
    </Box>
  );
}
