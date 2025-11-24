"use client";

import { SnackbarProvider, MaterialDesignContent } from "notistack";
import { ReactNode } from "react";
import { styled, alpha } from "@mui/material/styles";

// Custom styled snackbar content with MUI theme
const StyledMaterialDesignContent = styled(MaterialDesignContent)(
  ({ theme }) => ({
    "&.notistack-MuiContent-success": {
      backgroundColor: theme.palette.success.main,
      color: theme.palette.success.contrastText,
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.3)}`,
      fontFamily: theme.typography.fontFamily,
      "& .MuiSvgIcon-root": {
        color: theme.palette.success.contrastText,
      },
    },
    "&.notistack-MuiContent-error": {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.3)}`,
      fontFamily: theme.typography.fontFamily,
      "& .MuiSvgIcon-root": {
        color: theme.palette.error.contrastText,
      },
    },
    "&.notistack-MuiContent-warning": {
      backgroundColor: theme.palette.warning.main,
      color: theme.palette.warning.contrastText,
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.3)}`,
      fontFamily: theme.typography.fontFamily,
      "& .MuiSvgIcon-root": {
        color: theme.palette.warning.contrastText,
      },
    },
    "&.notistack-MuiContent-info": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
      fontFamily: theme.typography.fontFamily,
      "& .MuiSvgIcon-root": {
        color: theme.palette.primary.contrastText,
      },
    },
    "&.notistack-MuiContent-default": {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      borderRadius: Number(theme.shape.borderRadius) * 2,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
      fontFamily: theme.typography.fontFamily,
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
