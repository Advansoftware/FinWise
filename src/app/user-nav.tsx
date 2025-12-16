// src/app/user-nav.tsx
"use client";

import { useState } from "react";
import {
  Button,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  LinearProgress,
  Skeleton,
  ListItemIcon,
  ListItemText,
  alpha,
  Tooltip,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Settings,
  Gem,
  UserCircle,
  LogOut,
  Trophy,
  ExternalLink,
  Flame,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/use-gamification";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { usePlan } from "@/hooks/use-plan";
import { useCredits } from "@/hooks/use-credits";
import { useAISettings } from "@/hooks/use-ai-settings";

interface UserNavProps {
  /** Modo compacto para uso em headers mobile */
  compact?: boolean;
}

export function UserNav({ compact = false }: UserNavProps) {
  const { user, logout, loading } = useAuth();
  const {
    gamificationData,
    isLoading: isGamificationLoading,
    calculateProgress,
    getLevelInfo,
  } = useGamification();
  const { plan, isPlus, isInfinity } = usePlan();
  const { credits, isLoading: isLoadingCredits } = useCredits();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Verificar qual IA está sendo usada
  const activeCredential = displayedCredentials.find(
    (c) => c.id === activeCredentialId
  );
  const isUsingGastometriaAI =
    activeCredential?.id === "gastometria-ai-default" ||
    activeCredential?.provider === "gastometria" ||
    !activeCredential;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Skeleton
        variant="circular"
        width={compact ? 32 : 36}
        height={compact ? 32 : 36}
      />
    );
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const levelProgress = gamificationData
    ? calculateProgress()
    : { progress: 0, current: 0, next: 100 };
  const levelInfo = gamificationData
    ? getLevelInfo(gamificationData.level.level)
    : null;

  const avatarSize = compact ? 32 : 36;

  return (
    <>
      <Tooltip
        title={
          gamificationData
            ? `Nível ${gamificationData.level.level} - ${levelInfo?.name}`
            : "Carregando..."
        }
      >
        <IconButton
          onClick={handleClick}
          sx={{
            p: compact ? 0.25 : 0.5,
          }}
        >
          <Avatar
            sx={{
              width: avatarSize,
              height: avatarSize,
              bgcolor: "primary.main",
              fontSize: compact ? "0.75rem" : "0.875rem",
              fontWeight: 600,
            }}
            src={user?.image || undefined}
            alt={user?.displayName || "User"}
          >
            {getInitials(user?.displayName)}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              mt: 1,
              borderRadius: 2,
              boxShadow: (theme) =>
                `0 4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
            },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.displayName || "Usuário"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || "Bem-vindo!"}
          </Typography>
        </Box>

        {/* Créditos de IA e IA em uso */}
        {plan !== "Básico" && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Sparkles
                    size={16}
                    style={{ color: credits < 5 ? "#ef4444" : "#6366f1" }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {isLoadingCredits ? "..." : credits} créditos
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={isUsingGastometriaAI ? "Gastometria IA" : "IA Própria"}
                  icon={
                    isUsingGastometriaAI ? (
                      <Sparkles size={12} />
                    ) : (
                      <Zap size={12} />
                    )
                  }
                  sx={{
                    height: 22,
                    fontSize: "0.65rem",
                    ...(isUsingGastometriaAI
                      ? {
                          bgcolor: "rgba(59, 130, 246, 0.1)",
                          color: "#2563eb",
                          borderColor: "rgba(59, 130, 246, 0.2)",
                          "& .MuiChip-icon": { color: "#2563eb" },
                        }
                      : {
                          bgcolor: "rgba(16, 185, 129, 0.1)",
                          color: "#059669",
                          borderColor: "rgba(16, 185, 129, 0.2)",
                          "& .MuiChip-icon": { color: "#059669" },
                        }),
                  }}
                  variant="outlined"
                />
              </Box>
              {isUsingGastometriaAI && (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontSize: "0.65rem" }}
                >
                  {isPlus
                    ? "Configure Ollama local para uso ilimitado"
                    : isInfinity
                    ? "Configure suas credenciais para uso ilimitado"
                    : ""}
                </Typography>
              )}
              {!isUsingGastometriaAI && (
                <Typography
                  variant="caption"
                  sx={{ color: "#059669", fontSize: "0.65rem" }}
                >
                  Uso ilimitado e gratuito! 🎉
                </Typography>
              )}
            </Box>
          </>
        )}

        {/* Gamification Section - Melhorado */}
        {isGamificationLoading ? (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="rectangular" height={4} sx={{ mt: 1 }} />
          </Box>
        ) : (
          gamificationData &&
          levelInfo && (
            <Box>
              <Divider />
              <Box sx={{ px: 2, py: 1.5 }}>
                {/* Nível com ícone e título */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        background: (theme) =>
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 88, 12, 0.3) 100%)"
                            : "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                        border: 1,
                        borderColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(245, 158, 11, 0.5)"
                            : "rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      {levelInfo.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ display: "block", lineHeight: 1.2 }}
                      >
                        Nível {gamificationData.level.level}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.65rem" }}
                      >
                        {levelInfo.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="primary.main"
                    >
                      {gamificationData.points} XP
                    </Typography>
                  </Box>
                </Box>

                {/* Barra de progresso */}
                <Box sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      Próximo nível
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      {levelProgress.current}/{levelProgress.next}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={levelProgress.progress}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        background:
                          "linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)",
                      },
                    }}
                  />
                </Box>

                {/* Streak de pagamentos */}
                {gamificationData.streaks.payments.current > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      p: 0.75,
                      borderRadius: 1,
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(249, 115, 22, 0.1)"
                          : "rgba(249, 115, 22, 0.08)",
                      border: 1,
                      borderColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(249, 115, 22, 0.3)"
                          : "rgba(249, 115, 22, 0.2)",
                    }}
                  >
                    <Flame size={14} style={{ color: "#f97316" }} />
                    <Typography
                      variant="caption"
                      sx={{ color: "#f97316", fontWeight: 500 }}
                    >
                      {gamificationData.streaks.payments.current} meses em dia!
                    </Typography>
                  </Box>
                )}

                {/* Badges recentes */}
                {gamificationData.badges.length > 0 && (
                  <Box
                    sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}
                  >
                    {gamificationData.badges.slice(0, 5).map((badge) => (
                      <Tooltip key={badge.id} title={badge.name}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            bgcolor: "action.hover",
                          }}
                        >
                          {badge.icon}
                        </Box>
                      </Tooltip>
                    ))}
                    {gamificationData.badges.length > 5 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ alignSelf: "center", ml: 0.5 }}
                      >
                        +{gamificationData.badges.length - 5}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )
        )}

        <Divider />

        {/* Menu Items */}
        <MenuItem component={Link} href="/profile" sx={{ py: 1.25 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <UserCircle size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Perfil"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </MenuItem>

        <MenuItem component={Link} href="/billing" sx={{ py: 1.25 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Gem size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Assinatura"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </MenuItem>

        <MenuItem component={Link} href="/settings" sx={{ py: 1.25 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Settings size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Configurações de IA"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </MenuItem>

        {plan && plan !== "Básico" && (
          <Box sx={{ px: 1 }}>
            <BillingPortalButton
              variant="text"
              size="small"
              sx={{
                width: "100%",
                justifyContent: "flex-start",
                py: 1.25,
                px: 1,
                color: "text.primary",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ExternalLink size={18} style={{ marginRight: "8px" }} />
              Portal de Faturamento
            </BillingPortalButton>
          </Box>
        )}

        <Divider />

        <MenuItem
          onClick={() => {
            handleClose();
            logout();
          }}
          sx={{
            py: 1.25,
            color: "error.main",
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
            <LogOut size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Sair"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
