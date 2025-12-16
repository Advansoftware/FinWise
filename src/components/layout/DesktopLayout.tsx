// src/components/layout/DesktopLayout.tsx
// Layout para desktop com sidebar

"use client";

import { Drawer, Box, Divider, alpha } from "@mui/material";
import { UserNav } from "@/app/user-nav";
import { Logo } from "@/components/logo";
import { AppNav } from "@/app/app-nav";
import { ChatAssistant } from "@/components/chat/chat-assistant";
import { PlanExpirationAlert } from "@/components/billing/plan-expiration-alert";

const DRAWER_WIDTH = 280;

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const drawer = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        // Glass morphism sutil
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: (theme) => alpha(theme.palette.divider, 0.1),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Logo sx={{ width: "2rem", height: "2rem" }} />
          <Box
            component="span"
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Gastometria
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto", px: 2, py: 2 }}>
        <AppNav />
      </Box>

      {/* User section */}
      <Divider
        sx={{ borderColor: (theme) => alpha(theme.palette.divider, 0.1) }}
      />
      <Box sx={{ p: 2 }}>
        <UserNav />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRight: 1,
              borderColor: (theme) => alpha(theme.palette.divider, 0.1),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{
            maxWidth: 1400,
            mx: "auto",
            px: { md: 3, lg: 4 },
            py: 3,
          }}
        >
          <PlanExpirationAlert />
          {children}
        </Box>

        {/* FAB flutuante - apenas chat */}
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <ChatAssistant />
        </Box>
      </Box>
    </Box>
  );
}
