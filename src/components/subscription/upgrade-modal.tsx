// src/components/subscription/upgrade-modal.tsx
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Sparkles,
  Check,
  Crown,
  Zap,
  Shield,
  X,
} from "lucide-react";
import { usePlanFeatures, FEATURE_INFO } from "@/hooks/use-plan-features";
import { useRouter } from "next/navigation";

export function UpgradeModal() {
  const theme = useTheme();
  const router = useRouter();
  const { isUpgradeModalOpen, currentFeature, closeUpgradeModal, userPlan } = usePlanFeatures();

  const featureInfo = currentFeature ? FEATURE_INFO[currentFeature] : null;

  const handleUpgrade = () => {
    closeUpgradeModal();
    router.push("/billing");
  };

  if (!featureInfo) return null;

  return (
    <Dialog
      open={isUpgradeModalOpen}
      onClose={closeUpgradeModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Header with gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: "white",
          p: 3,
          position: "relative",
        }}
      >
        <IconButton
          onClick={closeUpgradeModal}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
            opacity: 0.8,
            "&:hover": { opacity: 1 },
          }}
        >
          <X size={20} />
        </IconButton>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha("#fff", 0.2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Crown size={32} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Desbloqueie o {featureInfo.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Disponível nos planos Plus e Infinity
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ py: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {featureInfo.description}
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          O que você ganha:
        </Typography>

        <Stack spacing={1.5}>
          {featureInfo.benefits.map((benefit, index) => (
            <Stack key={index} direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  p: 0.5,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={16} color={theme.palette.success.main} />
              </Box>
              <Typography variant="body2">{benefit}</Typography>
            </Stack>
          ))}
        </Stack>

        {/* Pricing */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h4" fontWeight={700} color="primary">
              R$ 29,90
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /mês no plano Plus
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} mt={1}>
            <Shield size={14} color={theme.palette.text.secondary} />
            <Typography variant="caption" color="text.secondary">
              Cancele quando quiser • 7 dias grátis para testar
            </Typography>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={closeUpgradeModal} color="inherit">
          Agora não
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpgrade}
          startIcon={<Sparkles size={18} />}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            px: 4,
            "&:hover": {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            },
          }}
        >
          Fazer Upgrade
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// IconButton import was missing, adding inline component
function IconButton({ children, onClick, sx }: { children: React.ReactNode; onClick: () => void; sx?: any }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        background: "none",
        border: "none",
        cursor: "pointer",
        p: 1,
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: alpha("#fff", 0.1),
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
