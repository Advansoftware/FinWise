// src/components/open-finance/pluggy-connect-button.tsx

"use client";

import { useState } from "react";
import {
  Button,
  CircularProgress,
  Typography,
  Box,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import {
  AccountBalance as BankIcon,
  Add as AddIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { usePluggy } from "@/hooks/use-pluggy";
import { usePlanFeatures } from "@/hooks/use-plan-features";

interface PluggyConnectButtonProps {
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  showIcon?: boolean;
  label?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PluggyConnectButton({
  variant = "contained",
  size = "medium",
  fullWidth = false,
  showIcon = true,
  label = "Conectar Banco",
  onSuccess,
  onError,
}: PluggyConnectButtonProps) {
  const theme = useTheme();
  const { openConnectWidget, isConnecting } = usePluggy();
  const { canUseFeature, requireUpgrade } = usePlanFeatures();

  const handleClick = async () => {
    // Gate behind Plus/Infinity plan
    if (!canUseFeature('pluggy-connect')) {
      requireUpgrade('pluggy-connect');
      return;
    }

    const success = await openConnectWidget();
    if (success) {
      onSuccess?.();
    } else {
      onError?.("Falha ao conectar conta bancária");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={isConnecting}
      onClick={handleClick}
      startIcon={
        isConnecting ? (
          <CircularProgress size={20} color="inherit" />
        ) : showIcon ? (
          <BankIcon />
        ) : undefined
      }
      sx={{
        background:
          variant === "contained"
            ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            : undefined,
        "&:hover": {
          background:
            variant === "contained"
              ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
              : undefined,
        },
      }}
    >
      {isConnecting ? "Conectando..." : label}
    </Button>
  );
}

// ==================== CARD VARIANT ====================

interface PluggyConnectCardProps {
  onSuccess?: () => void;
}

export function PluggyConnectCard({ onSuccess }: PluggyConnectCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
      }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        >
          <LinkIcon sx={{ color: "white", fontSize: 28 }} />
        </Box>

        <Typography variant="h6" fontWeight="bold">
          Conecte sua Conta Bancária
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Importe suas transações automaticamente via Open Finance. Seguro e
          regulado pelo Banco Central.
        </Typography>

        <PluggyConnectButton
          variant="contained"
          size="large"
          label="Conectar via Open Finance"
          onSuccess={onSuccess}
        />

        <Typography variant="caption" color="text.secondary">
          Seus dados são criptografados e protegidos
        </Typography>
      </Stack>
    </Box>
  );
}
