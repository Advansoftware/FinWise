
'use client';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import { useGoals } from "@/hooks/use-goals";
import { AICreditIndicator } from "@/components/credits/ai-credit-indicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { GamificationProvider } from "@/hooks/use-gamification";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { completedGoal, clearCompletedGoal } = useGoals();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
       {completedGoal && <GoalCompletionCelebration goal={completedGoal} onComplete={clearCompletedGoal} />}
      <div className="flex min-h-screen">
          <Sidebar className="flex flex-col border-r fixed h-screen z-40 md:fixed md:inset-y-0 md:z-40">
              <SidebarHeader className="border-b p-4">
                  <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
                      <Logo className="w-8 h-8 shrink-0"/>
                      <span className="text-lg font-semibold group-data-[state=collapsed]:hidden">
                        Gastometria
                      </span>
                  </div>
              </SidebarHeader>
              <SidebarContent className="flex-1 overflow-hidden">
                <div className="h-full px-3 py-4 overflow-y-auto">
                    <AppNav />
                </div>
              </SidebarContent>
              <SidebarFooter className="border-t p-4">
                  <UserNav />
              </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col min-w-0 md:ml-[var(--sidebar-width)]">
              <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:hidden">
                  <div className="flex items-center gap-3">
                      <SidebarTrigger className="shrink-0" />
                      <Logo className="w-8 h-8 shrink-0"/>
                      <span className="text-lg font-semibold">Gastometria</span>
                  </div>
                  <div className="flex-1" />
                  <div className="lg:hidden">
                      <UserNav />
                  </div>
              </header>

              <div className="flex-1 h-[calc(100vh-3.5rem)] lg:h-screen overflow-y-auto">
                <div className="container mx-auto px-4 py-4 lg:px-6 lg:py-6 max-w-7xl pb-24 lg:pb-6">
                    {children}
                </div>
              </div>

              <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <AICreditIndicator />
                </div>
                <ChatAssistant />
              </div>
          </main>
      </div>
    </SidebarProvider>
  )
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
                          <AppLayoutContent>{children}</AppLayoutContent>
                        </GoalsProvider>
                      </BudgetsProvider>
                    </InstallmentsProvider>
                 </GamificationProvider>
              </ReportsProvider>
            </TransactionsProvider>
          </WalletsProvider>
        </CreditsProvider>
      </PlanProvider>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard isProtected>
      <InnerLayout>{children}</InnerLayout>
    </AuthGuard>
  );
}
