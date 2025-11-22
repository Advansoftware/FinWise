// src/components/mui-wrappers/toast.tsx
// MUI wrapper para Toast usando Snackbar
'use client';

import { Snackbar, Alert, AlertColor } from '@mui/material';
import { createContext, useContext, useState, ReactNode } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: AlertColor;
  duration?: number;
  action?: ReactNode;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...props, id }]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);

  // Show one toast at a time
  if (toasts.length > 0 && !currentToast) {
    setCurrentToast(toasts[0]);
  }

  const handleClose = () => {
    if (currentToast) {
      dismiss(currentToast.id);
      setCurrentToast(null);
    }
  };

  return (
    <Snackbar
      open={!!currentToast}
      autoHideDuration={currentToast?.duration || 5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {currentToast ? (
        <Alert
          onClose={handleClose}
          severity={currentToast.variant || 'info'}
          variant="filled"
          action={currentToast.action}
        >
          {currentToast.title && <strong>{currentToast.title}</strong>}
          {currentToast.description && <div>{currentToast.description}</div>}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}

// Legacy exports for compatibility
export const toast = (props: Omit<Toast, 'id'>) => {
  // This will be replaced by the context version
  console.warn('Using legacy toast, wrap app in ToastProvider');
};
