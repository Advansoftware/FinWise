// src/components/layout/MobileLayout.tsx
// Layout completo para mobile com bottom nav e header

"use client";

import { useState } from "react";
import { Box, alpha } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { ChatAssistant } from "@/components/chat/chat-assistant";
import { AICreditIndicator } from "@/components/credits/ai-credit-indicator";
import { PlanExpirationAlert } from "@/components/billing/plan-expiration-alert";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100dvh", // Dynamic viewport height para mobile
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Header */}
      <MobileHeader />

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: "auto",
          overscrollBehavior: "contain", // Previne bounce no iOS
          WebkitOverflowScrolling: "touch", // Scroll suave no iOS
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          sx={{
            px: 2,
            pt: 2,
            // Padding bottom para compensar bottom nav + safe area
            pb: "calc(80px + env(safe-area-inset-bottom))",
          }}
        >
          <PlanExpirationAlert />
          {children}
        </Box>
      </Box>

      {/* FABs flutuantes - posicionados acima do bottom nav */}
      <Box
        sx={{
          position: "fixed",
          bottom: "calc(72px + env(safe-area-inset-bottom))",
          right: 16,
          zIndex: 1100,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1,
        }}
      >
        <ChatAssistant />
        <AICreditIndicator />
      </Box>

      {/* Bottom Navigation */}
      <MobileBottomNav onMoreClick={() => setMoreMenuOpen(true)} />

      {/* Menu "Mais" */}
      <MobileMoreMenu
        open={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
      />
    </Box>
  );
}

