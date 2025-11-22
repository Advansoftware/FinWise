'use client';

import { SnackbarProvider } from 'notistack';
import { ReactNode } from 'react';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider 
      maxSnack={3}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={5000}
    >
      {children}
    </SnackbarProvider>
  );
}
