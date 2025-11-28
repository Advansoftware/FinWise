// src/components/mui-wrappers/alert-dialog.tsx
// MUI wrapper para substituir Radix UI AlertDialog
'use client';

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { ReactNode, useState, cloneElement, isValidElement, createContext, useContext } from 'react';

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | null>(null);

interface AlertDialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AlertDialog({ children, open: controlledOpen, onOpenChange }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setUncontrolledOpen;

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

interface AlertDialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function AlertDialogTrigger({ children, asChild }: AlertDialogTriggerProps) {
  const context = useContext(AlertDialogContext);
  
  const handleClick = () => {
    context?.setOpen(true);
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, { onClick: handleClick });
  }

  return <div onClick={handleClick}>{children}</div>;
}

interface AlertDialogContentProps {
  children: ReactNode;
}

export function AlertDialogContent({ children }: AlertDialogContentProps) {
  const context = useContext(AlertDialogContext);

  return (
    <Dialog
      open={context?.open || false}
      onClose={() => context?.setOpen(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {children}
    </Dialog>
  );
}

interface AlertDialogHeaderProps {
  children: ReactNode;
}

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return <>{children}</>;
}

interface AlertDialogTitleProps {
  children: ReactNode;
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return <DialogTitle id="alert-dialog-title">{children}</DialogTitle>;
}

interface AlertDialogDescriptionProps {
  children: ReactNode;
}

export function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return <DialogContentText id="alert-dialog-description">{children}</DialogContentText>;
}

interface AlertDialogFooterProps {
  children: ReactNode;
}

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return <DialogActions>{children}</DialogActions>;
}

interface AlertDialogActionProps extends React.ComponentProps<typeof Button> {
  children: ReactNode;
  onClick?: () => void;
}

export function AlertDialogAction({ children, onClick, ...props }: AlertDialogActionProps) {
  const context = useContext(AlertDialogContext);
  
  const handleClick = () => {
    if (onClick) onClick();
    context?.setOpen(false);
  };

  return <Button variant="contained" onClick={handleClick} {...props}>{children}</Button>;
}

interface AlertDialogCancelProps extends React.ComponentProps<typeof Button> {
  children: ReactNode;
}

export function AlertDialogCancel({ children, onClick, ...props }: AlertDialogCancelProps) {
  const context = useContext(AlertDialogContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) onClick(e);
      context?.setOpen(false);
  }

  return <Button variant="outlined" onClick={handleClick} {...props}>{children}</Button>;
}
