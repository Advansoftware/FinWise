"use client";

import { SnackbarProvider, MaterialDesignContent } from "notistack";
import { ReactNode } from "react";
import { styled, alpha } from "@mui/material/styles";

// Custom styled snackbar content with MUI theme - Dark mode only
const StyledMaterialDesignContent = styled(MaterialDesignContent)(
  ({ theme }) => ({
    "&.notistack-MuiContent-success": {
      backgroundColor: "#10b981",
      color: "#ffffff !important",
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha("#10b981", 0.4)}`,
      fontFamily: theme.typography.fontFamily,
      "& *": {
        color: "#ffffff !important",
      },
    },
    "&.notistack-MuiContent-error": {
      backgroundColor: "#ef4444",
      color: "#ffffff !important",
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha("#ef4444", 0.4)}`,
      fontFamily: theme.typography.fontFamily,
      "& *": {
        color: "#ffffff !important",
      },
    },
    "&.notistack-MuiContent-warning": {
      backgroundColor: "#f59e0b",
      color: "#000000 !important",
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha("#f59e0b", 0.4)}`,
      fontFamily: theme.typography.fontFamily,
      "& *": {
        color: "#000000 !important",
      },
    },
    "&.notistack-MuiContent-info": {
      backgroundColor: theme.palette.primary.main,
      color: "#ffffff !important",
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
      fontFamily: theme.typography.fontFamily,
      "& *": {
        color: "#ffffff !important",
      },
    },
    "&.notistack-MuiContent-default": {
      backgroundColor: theme.palette.background.paper,
      color: `${theme.palette.text.primary} !important`,
      borderRadius: Number(theme.shape.borderRadius) * 2,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.3)}`,
      fontFamily: theme.typography.fontFamily,
      "& *": {
        color: `${theme.palette.text.primary} !important`,
      },
    },
  })
);

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      autoHideDuration={5000}
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
