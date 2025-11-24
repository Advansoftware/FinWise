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
} from "@mui/material";
import {
  Settings,
  Gem,
  UserCircle,
  LogOut,
  Trophy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useGamification } from "@/hooks/use-gamification";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { usePlan } from "@/hooks/use-plan";

export function UserNav() {
  const { user, logout, loading } = useAuth();
  const { gamificationData, isLoading: isGamificationLoading } =
    useGamification();
  const { plan } = usePlan();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return <Skeleton variant="circular" width={36} height={36} />;
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
    ? (gamificationData.points /
        (gamificationData.level.pointsRequired +
          gamificationData.level.pointsToNext)) *
      100
    : 0;

  return (
    <>
      <Button
        onClick={handleClick}
        sx={{
          minWidth: 0,
          p: 0.5,
          borderRadius: "50%",
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "primary.main",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
          src={user?.image || undefined}
          alt={user?.displayName || "User"}
        >
          {getInitials(user?.displayName)}
        </Avatar>
      </Button>

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
              width: 260,
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

        {/* Gamification Section */}
        {isGamificationLoading ? (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="rectangular" height={4} sx={{ mt: 1 }} />
          </Box>
        ) : (
          gamificationData && (
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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                    }}
                  >
                    <Trophy size={16} style={{ color: "#f59e0b" }} />
                    <Typography variant="caption" fontWeight={600}>
                      Nível {gamificationData.level.level}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {gamificationData.points} pts
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={levelProgress}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            </>
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
            primary="Configurações"
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
