"use client"

import { useSnackbar, VariantType } from 'notistack';
import { ReactNode } from 'react';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: VariantType;
  duration?: number;
  action?: ReactNode;
}

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const toast = (options: ToastOptions) => {
    const { title, description, variant = 'default', duration = 5000, action } = options;
    
    // Combine title and description into message
    let message: ReactNode = description || '';
    
    if (title && description) {
      message = (
        <>
          <strong style={{ display: 'block', marginBottom: '4px' }}>{title}</strong>
          <div>{description}</div>
        </>
      );
    } else if (title) {
      message = <strong>{title}</strong>;
    }

    enqueueSnackbar(message, {
      variant: variant === 'default' ? 'info' : variant,
      autoHideDuration: duration === Infinity ? null : duration,
      action,
    });
  };

return {
  toast,
  dismiss: closeSnackbar,
};
}

// Legacy export for compatibility
export { useSnackbar };
