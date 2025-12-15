// src/components/layout/MobileHeader.tsx
// Header compacto para mobile estilo app

"use client";

import { Box, IconButton, Typography, alpha } from "@mui/material";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { usePageTitle } from "./usePageTitle";
import { Logo } from "@/components/logo";
import { UserNav } from "@/app/user-nav";

interface MobileHeaderProps {
  showBack?: boolean;
  title?: string;
  rightAction?: React.ReactNode;
}

export function MobileHeader({ showBack, title, rightAction }: MobileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pageInfo = usePageTitle();

  // Determinar se deve mostrar botão de voltar
  const isMainPage = [
    "/dashboard",
  ].includes(pathname);

  const shouldShowBack = showBack ?? !isMainPage;
  const displayTitle = title ?? pageInfo.title;

  // No dashboard, mostrar logo
  const isDashboard = pathname === "/dashboard";

  return (
    <Box
      component={motion.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      sx={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        // Glass morphism
        bgcolor: (theme) =>
          alpha(theme.palette.background.paper, 0.85),
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: 1,
        borderColor: (theme) =>
          alpha(theme.palette.divider, 0.08),
        // Safe area para dispositivos com notch
        pt: "env(safe-area-inset-top)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          px: 1,
        }}
      >
        {/* Lado esquerdo - Botão voltar ou Logo */}
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 48 }}>
          {shouldShowBack ? (
            <IconButton
              onClick={() => router.back()}
              size="small"
              sx={{
                color: "text.primary",
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ArrowLeft size={22} />
            </IconButton>
          ) : isDashboard ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
              <Logo sx={{ width: 28, height: 28 }} />
            </Box>
          ) : null}
        </Box>

        {/* Centro - Título */}
        <Typography
          variant="h6"
          component={motion.h1}
          key={displayTitle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            fontWeight: 600,
            fontSize: "1.1rem",
            textAlign: "center",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            px: 1,
          }}
        >
          {displayTitle}
        </Typography>

        {/* Lado direito - Ações */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minWidth: 48,
            justifyContent: "flex-end",
          }}
        >
          {rightAction ?? <UserNav compact />}
        </Box>
      </Box>
    </Box>
  );
}
