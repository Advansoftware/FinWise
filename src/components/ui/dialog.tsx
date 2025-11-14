"use client"

import * as React from "react"
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  DialogProps as MuiDialogProps,
  IconButton,
  Typography,
  type SxProps,
  type Theme,
  useTheme,
} from '@mui/material';
import { X } from "lucide-react"

// Dialog principal - usa o MUI Dialog diretamente
interface DialogProps extends Omit<MuiDialogProps, 'open'> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = ({ open, onOpenChange, onClose, ...props }: DialogProps) => {
  const handleClose = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    if (onOpenChange) {
      onOpenChange(false);
    }
    if (onClose) {
      onClose(event, reason);
    }
  };

  return (
    <MuiDialog
      open={open || false}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: (theme) => ({
          borderRadius: theme.shape.borderRadius,
          border: `1px solid ${theme.palette.custom.border}`,
          backgroundColor: theme.palette.background.default,
          boxShadow: theme.shadows[8],
        }),
      }}
      {...props}
    />
  );
};

// DialogTrigger - wrapper para botão que abre o dialog
interface DialogTriggerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

const DialogTrigger = ({ children, asChild, ...props }: DialogTriggerProps) => {
  // Se asChild, retorna o children diretamente (precisa ter onClick configurado externamente)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props as any);
  }
  
  return <div {...props}>{children}</div>;
};

// DialogClose - componente para fechar o dialog (compatibilidade)
interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogClose = ({ children, asChild, onClick, ...props }: DialogCloseProps) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick } as any);
  }
  
  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
};

// DialogContent - wrapper do conteúdo com botão de fechar
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
  onClose?: () => void;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, sx, onClose, ...props }, ref) => (
    <MuiDialogContent
      ref={ref}
      sx={{
        p: 6,
        position: 'relative',
        ...sx,
      }}
      {...props}
    >
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 16,
            top: 16,
            borderRadius: '4px',
            opacity: 0.7,
            transition: theme.transitions.create('opacity'),
            '&:hover': {
              opacity: 1,
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.custom.ring}`,
              outlineOffset: 2,
            },
          })}
          aria-label="Close"
        >
          <X style={{ width: '1rem', height: '1rem' }} />
        </IconButton>
      )}
      {children}
    </MuiDialogContent>
  )
);
DialogContent.displayName = "DialogContent";

// DialogHeader - container para título e descrição
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ children, sx, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        textAlign: 'center',
      }}
      {...props}
    >
      {children}
    </div>
  )
);
DialogHeader.displayName = "DialogHeader";

// DialogFooter - container para ações
const DialogFooter = ({ children, sx, ...props }: DialogHeaderProps) => (
  <MuiDialogActions
    sx={{
      display: 'flex',
      flexDirection: { xs: 'column-reverse', sm: 'row' },
      justifyContent: { sm: 'flex-end' },
      gap: { sm: 2 },
      p: 6,
      pt: 0,
      ...sx,
    }}
    {...props}
  >
    {children}
  </MuiDialogActions>
);
DialogFooter.displayName = "DialogFooter";

// DialogTitle - título do dialog
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  sx?: SxProps<Theme>;
}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ children, sx, ...props }, ref) => (
    <MuiDialogTitle
      ref={ref}
      sx={{
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '-0.025em',
        p: 6,
        pb: 0,
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiDialogTitle>
  )
);
DialogTitle.displayName = "DialogTitle";

// DialogDescription - descrição do dialog
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  sx?: SxProps<Theme>;
}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ children, sx, ...props }, ref) => {
    const theme = useTheme();
    
    return (
      <Typography
        ref={ref}
        variant="body2"
        sx={{
          color: theme.palette.custom.mutedForeground,
          ...(typeof sx === 'function' ? sx(theme) : sx),
        }}
        {...props}
      >
        {children}
      </Typography>
    );
  }
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
export type { DialogProps, DialogContentProps, DialogTitleProps, DialogDescriptionProps }
