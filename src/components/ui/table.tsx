"use client"

import * as React from "react"
import {Table as MuiTable, TableBody as MuiTableBody, TableCell as MuiTableCell, TableContainer, TableFooter as MuiTableFooter, TableHead as MuiTableHead, TableRow as MuiTableRow, Paper, type SxProps, type Theme, useTheme} from '@mui/material';
import {styled} from '@mui/material/styles';

// Table Container com scroll
interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
}

const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ children, sx, ...props }, ref) => {
    const theme = useTheme();
    
    return (
      <TableContainer
        ref={ref}
        component={Paper}
        sx={{
          width: '100%',
          position: 'relative',
          overflow: 'auto',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          ...(typeof sx === 'function' ? sx(theme) : sx),
        }}
        {...props}
      >
        <MuiTable sx={{ width: '100%', captionSide: 'bottom', fontSize: theme.typography.pxToRem(14) }}>
          {children}
        </MuiTable>
      </TableContainer>
    );
  }
);
Table.displayName = "Table";

// TableHeader
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sx?: SxProps<Theme>;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ sx, ...props }, ref) => (
    <MuiTableHead
      ref={ref}
      sx={{
        '& tr': {
          borderBottom: theme => `1px solid ${theme.palette.custom.border}`,
        },
        ...sx,
      }}
      {...props}
    />
  )
);
TableHeader.displayName = "TableHeader";

// TableBody
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sx?: SxProps<Theme>;
}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ sx, ...props }, ref) => (
    <MuiTableBody
      ref={ref}
      sx={{
        '& tr:last-child': {
          border: 0,
        },
        ...sx,
      }}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

// TableFooter
interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sx?: SxProps<Theme>;
}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ sx, ...props }, ref) => {
    const theme = useTheme();
    
    return (
      <MuiTableFooter
        ref={ref}
        sx={{
          borderTop: `1px solid ${theme.palette.custom.border}`,
          backgroundColor: `${theme.palette.custom.muted}80`,
          fontWeight: theme.typography.fontWeightMedium,
          '& > tr:last-child': {
            borderBottom: 0,
          },
          ...(typeof sx === 'function' ? sx(theme) : sx),
        }}
        {...props}
      />
    );
  }
);
TableFooter.displayName = "TableFooter";

// TableRow
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  sx?: SxProps<Theme>;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ sx, ...props }, ref) => {
    const theme = useTheme();
    
    return (
      <MuiTableRow
        ref={ref}
        sx={{
          borderBottom: `1px solid ${theme.palette.custom.border}`,
          transition: theme.transitions.create('background-color'),
          '&:hover': {
            backgroundColor: `${theme.palette.custom.muted}80`,
          },
          '&[data-state="selected"]': {
            backgroundColor: theme.palette.custom.muted,
          },
          ...(typeof sx === 'function' ? sx(theme) : sx),
        }}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

// TableHead (célula de cabeçalho)
interface TableHeadProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  sx?: SxProps<Theme>;
  align?: 'left' | 'center' | 'right' | 'inherit' | 'justify';
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ sx, align, ...props }, ref) => {
    const theme = useTheme();
    
    return (
      <MuiTableCell
        ref={ref}
        component="th"
        align={align}
        sx={{
          height: '48px',
          padding: '0 16px',
          textAlign: 'left',
          verticalAlign: 'middle',
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.custom.mutedForeground,
          '&:has([role="checkbox"])': {
            paddingRight: 0,
          },
          ...(typeof sx === 'function' ? sx(theme) as object : sx),
        }}
        {...props}
      />
    );
  }
);
TableHead.displayName = "TableHead";

// TableCell (célula de dados)
interface TableCellProps extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  sx?: SxProps<Theme>;
  align?: 'left' | 'center' | 'right' | 'inherit' | 'justify';
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ sx, align, ...props }, ref) => (
    <MuiTableCell
      ref={ref}
      align={align}
      sx={{
        padding: '16px',
        verticalAlign: 'middle',
        '&:has([role="checkbox"])': {
          paddingRight: 0,
        },
        ...sx,
      }}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// TableCaption
interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  sx?: SxProps<Theme>;
}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ sx, style, ...props }, ref) => (
    <caption
      ref={ref}
      style={{
        marginTop: '16px',
        fontSize: '0.875rem',
        ...style,
      }}
      {...props}
    />
  )
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
}
