// src/components/layout/MobileBottomNav.tsx
// Bottom Navigation estilo app Android com glass morphism

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Box, alpha, Badge } from "@mui/material";
import {
  Home,
  History,
  Wallet,
  Target,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";

// Itens principais do bottom nav (máximo 5 para UX mobile)
const navItems = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/transactions", label: "Transações", icon: History },
  { href: "/wallets", label: "Carteiras", icon: Wallet },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/more", label: "Mais", icon: MoreHorizontal },
];

interface MobileBottomNavProps {
  onMoreClick?: () => void;
}

export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Verificar se a página atual está em "Mais"
  const morePages = [
    "/categories",
    "/budgets",
    "/installments",
    "/reports",
    "/payments",
    "/tools",
    "/import",
    "/profile",
    "/settings",
    "/billing",
  ];
  const isMoreActive = morePages.some((page) => pathname.startsWith(page));

  const handleNavClick = (href: string) => {
    if (href === "/more") {
      onMoreClick?.();
    } else {
      router.push(href);
    }
  };

  return (
    <Box
      component="nav"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        // Glass morphism effect
        bgcolor: (theme) =>
          alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: 1,
        borderColor: (theme) =>
          alpha(theme.palette.divider, 0.1),
        // Safe area para dispositivos com notch
        pb: "env(safe-area-inset-bottom)",
        boxShadow: (theme) =>
          `0 -4px 30px ${alpha(theme.palette.common.black, 0.1)}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: 64,
          maxWidth: 500,
          mx: "auto",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/more"
              ? isMoreActive
              : pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const IconComponent = item.icon;

          return (
            <Box
              key={item.href}
              component={motion.button}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNavClick(item.href)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                minWidth: 64,
                height: "100%",
                border: "none",
                bgcolor: "transparent",
                cursor: "pointer",
                color: isActive ? "primary.main" : "text.secondary",
                transition: "color 0.2s ease",
                position: "relative",
                "&:focus": {
                  outline: "none",
                },
              }}
            >
              {/* Indicador ativo */}
              {isActive && (
                <Box
                  component={motion.div}
                  layoutId="bottomNavIndicator"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 3,
                    borderRadius: "0 0 4px 4px",
                    bgcolor: "primary.main",
                  }}
                />
              )}

              {/* Ícone com possível badge */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                }}
              >
                <IconComponent
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Box>

              {/* Label */}
              <Box
                component="span"
                sx={{
                  fontSize: "0.625rem",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: 0.2,
                  lineHeight: 1,
                }}
              >
                {item.label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
