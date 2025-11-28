// src/components/transactions/data-table.tsx
'use client';

import {ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, useReactTable, SortingState, ColumnFiltersState, RowSelectionState} from '@tanstack/react-table';

import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  TableContainer, 
  Paper,
  Button,
  TextField,
  Box,
  Stack,
  Typography,
  alpha
} from '@mui/material';
import {useState} from 'react';
import {AnalyzeTransactionsDialog} from './analyze-transactions-dialog';

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
    <Paper 
      variant="outlined" 
      sx={{ 
        width: '100%', 
        overflow: 'hidden',
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems="center" 
        justifyContent="space-between" 
        spacing={2} 
        sx={{ 
          p: 2,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.15)}`,
        }}
      >
        <TextField
          placeholder="Filtrar por item..."
          value={(table.getColumn("item")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("item")?.setFilterValue(event.target.value)
          }
          size="small"
          sx={{ 
            maxWidth: '24rem', 
            width: '100%',
            '& .MuiOutlinedInput-root': {
              bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
            }
          }}
        />
        {selectedRows.length > 0 && (
          <AnalyzeTransactionsDialog transactions={selectedRows as any} />
        )}
      </Stack>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
            <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                    return (
                    <TableCell 
                        key={header.id} 
                        sx={{ 
                            fontWeight: 'bold',
                            width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
                            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderBottom: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                    >
                        {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                            )}
                    </TableCell>
                    );
                })}
                </TableRow>
            ))}
            </TableHead>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow
                    key={row.id}
                    selected={row.getIsSelected()}
                    hover
                >
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Nenhum resultado encontrado.</Typography>
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </TableContainer>
       <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="flex-end" 
        spacing={2} 
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: (theme) => alpha(theme.palette.divider, 0.15),
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionadas.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </Stack>
    </Paper>
  );
}
