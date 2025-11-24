"use client";

import { useState } from "react";
import {
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { UserNav } from "../user-nav";
import { Logo } from "@/components/logo";
import { AppNav } from "../app-nav";
import { PWAUpdater } from "@/components/pwa-updater";
import { ChatAssistant } from "@/components/chat/chat-assistant";
import { TransactionsProvider } from "@/hooks/use-transactions";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BudgetsProvider } from "@/hooks/use-budgets";
import { GoalsProvider } from "@/hooks/use-goals";
import { WalletsProvider } from "@/hooks/use-wallets";
import { ReportsProvider } from "@/hooks/use-reports";
import { InstallmentsProvider } from "@/hooks/use-installments";
import { PlanProvider } from "@/hooks/use-plan";
import { CreditsProvider } from "@/hooks/use-credits";
import { GoalCompletionCelebration } from "@/components/goals/goal-celebration";
import { OnlineStatusIndicator } from "@/components/online-status-indicator";
import { useGoals } from "@/hooks/use-goals";
import { AICreditIndicator } from "@/components/credits/ai-credit-indicator";
import { GamificationProvider } from "@/hooks/use-gamification";
import { PlanExpirationAlert } from "@/components/billing/plan-expiration-alert";
import { BankPaymentProvider } from "@/hooks/use-bank-payment";

const drawerWidth = 280;

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { completedGoal, clearCompletedGoal } = useGoals();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileNavigation = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Logo sx={{ width: "2rem", height: "2rem" }} />
          <Box component="span" sx={{ fontSize: "18px", fontWeight: 600 }}>
            Gastometria
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2, py: 2 }}>
        <AppNav onNavigate={handleMobileNavigation} />
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        <UserNav />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {completedGoal && (
        <GoalCompletionCelebration
          goal={completedGoal}
          onComplete={clearCompletedGoal}
        />
      )}
      <OnlineStatusIndicator />

      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          display: { md: "none" },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Logo sx={{ width: "2rem", height: "2rem", mr: 1.5 }} />
          <Box component="span" sx={{ fontSize: "18px", fontWeight: 600 }}>
            Gastometria
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <UserNav />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: "64px", md: 0 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: "auto",
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 12, md: 4 },
          }}
        >
          <PlanExpirationAlert />
          {children}
        </Box>

        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1.5,
          }}
        >
          <ChatAssistant />
          <AICreditIndicator />
        </Box>
      </Box>
    </Box>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <CreditsProvider>
        <WalletsProvider>
          <TransactionsProvider>
            <ReportsProvider>
              <GamificationProvider>
                <InstallmentsProvider>
                  <BudgetsProvider>
                    <GoalsProvider>
                      <BankPaymentProvider>
                        <AppLayoutContent>{children}</AppLayoutContent>
                      </BankPaymentProvider>
                    </GoalsProvider>
                  </BudgetsProvider>
                </InstallmentsProvider>
              </GamificationProvider>
            </ReportsProvider>
          </TransactionsProvider>
        </WalletsProvider>
      </CreditsProvider>
    </PlanProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard isProtected>
      <InnerLayout>{children}</InnerLayout>
    </AuthGuard>
  );
}
