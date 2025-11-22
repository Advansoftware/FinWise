// src/components/mui-wrappers/table.tsx
// MUI wrapper para Table
'use client';

import {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TableContainer,
  Paper,
  TableProps as MuiTableProps,
  TableBodyProps,
  TableCellProps,
  TableHeadProps,
  TableRowProps,
} from '@mui/material';

export function Table({ children, ...props }: MuiTableProps) {
  return (
    <TableContainer component={Paper}>
      <MuiTable {...props}>{children}</MuiTable>
    </TableContainer>
  );
}

export function TableHeader({ children, ...props }: TableHeadProps) {
  return <MuiTableHead {...props}>{children}</MuiTableHead>;
}

export function TableBody({ children, ...props }: TableBodyProps) {
  return <MuiTableBody {...props}>{children}</MuiTableBody>;
}

export function TableRow({ children, ...props }: TableRowProps) {
  return <MuiTableRow {...props}>{children}</MuiTableRow>;
}

export function TableHead({ children, ...props }: TableCellProps) {
  return (
    <MuiTableCell {...props} component="th">
      {children}
    </MuiTableCell>
  );
}

export function TableCell({ children, ...props }: TableCellProps) {
  return <MuiTableCell {...props}>{children}</MuiTableCell>;
}
