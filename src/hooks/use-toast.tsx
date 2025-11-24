"use client";

import { useSnackbar, VariantType, SnackbarKey } from "notistack";
import { ReactNode } from "react";
import { Box, Typography, IconButton, alpha } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "success" | "error" | "warning" | "info" | "default";
  duration?: number;
  action?: ReactNode;
}

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const toast = (options: ToastOptions) => {
    const {
      title,
      description,
      variant = "default",
      duration = 5000,
      action,
    } = options;

    // Custom message component
    const message = (
      <Box sx={{ minWidth: 0 }}>
        {title && (
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              lineHeight: 1.3,
              mb: description ? 0.25 : 0,
            }}
          >
            {title}
          </Typography>
        )}
        {description && (
          <Typography
            variant="body2"
            sx={{
              opacity: 0.9,
              lineHeight: 1.4,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    );

    const snackbarVariant: VariantType =
      variant === "default" ? "info" : variant;

    const key = enqueueSnackbar(message, {
      variant: snackbarVariant,
      autoHideDuration: duration === Infinity ? null : duration,
      action: (snackbarKey: SnackbarKey) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {action}
          <IconButton
            size="small"
            onClick={() => closeSnackbar(snackbarKey)}
            sx={{
              color: "inherit",
              opacity: 0.8,
              "&:hover": {
                opacity: 1,
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    });

    return key;
  };

  return {
    toast,
    dismiss: closeSnackbar,
  };
}

// Legacy export for compatibility
export { useSnackbar };
