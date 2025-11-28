"use client";

import { SnackbarProvider, MaterialDesignContent } from "notistack";
import { ReactNode } from "react";
import { styled, alpha } from "@mui/material/styles";

// Custom styled snackbar content with MUI theme - Dark mode only with glassmorphism
const StyledMaterialDesignContent = styled(MaterialDesignContent)(
  ({ theme }) => ({
    "&.notistack-MuiContent-success": {
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(16, 185, 129, 0.3)",
      color: "#10b981 !important",
      borderRadius: 8,
      padding: "4px 16px",
      minWidth: "auto",
      boxShadow: "none",
      fontFamily: theme.typography.fontFamily,
      fontSize: "0.875rem",
      "& *": {
        color: "#10b981 !important",
      },
      "& .SnackbarItem-message": {
        padding: 0,
      },
    },
    "&.notistack-MuiContent-error": {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      color: "#f87171 !important",
      borderRadius: 8,
      padding: "4px 16px",
      minWidth: "auto",
      boxShadow: "none",
      fontFamily: theme.typography.fontFamily,
      fontSize: "0.875rem",
      "& *": {
        color: "#f87171 !important",
      },
      "& .SnackbarItem-message": {
        padding: 0,
      },
    },
    "&.notistack-MuiContent-warning": {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      color: "#f59e0b !important",
      borderRadius: 8,
      padding: "4px 16px",
      minWidth: "auto",
      boxShadow: "none",
      fontFamily: theme.typography.fontFamily,
      fontSize: "0.875rem",
      "& *": {
        color: "#f59e0b !important",
      },
      "& .SnackbarItem-message": {
        padding: 0,
      },
    },
    "&.notistack-MuiContent-info": {
      backgroundColor: "rgba(59, 130, 246, 0.15)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      color: "#3b82f6 !important",
      borderRadius: 8,
      padding: "4px 16px",
      minWidth: "auto",
      boxShadow: "none",
      fontFamily: theme.typography.fontFamily,
      fontSize: "0.875rem",
      "& *": {
        color: "#3b82f6 !important",
      },
      "& .SnackbarItem-message": {
        padding: 0,
      },
    },
    "&.notistack-MuiContent-default": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${theme.palette.divider}`,
      color: `${theme.palette.text.primary} !important`,
      borderRadius: 8,
      padding: "4px 16px",
      minWidth: "auto",
      boxShadow: "none",
      fontFamily: theme.typography.fontFamily,
      fontSize: "0.875rem",
      "& *": {
        color: `${theme.palette.text.primary} !important`,
      },
      "& .SnackbarItem-message": {
        padding: 0,
      },
    },
  })
);

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={2}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      autoHideDuration={3000}
      dense
      Components={{
        success: StyledMaterialDesignContent,
        error: StyledMaterialDesignContent,
        warning: StyledMaterialDesignContent,
        info: StyledMaterialDesignContent,
        default: StyledMaterialDesignContent,
      }}
    >
      {children}
    </SnackbarProvider>
  );
}
