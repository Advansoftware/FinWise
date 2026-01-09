"use client";

import { Box } from "@mui/material";
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
import { GamificationProvider } from "@/hooks/use-gamification";
import { BankPaymentProvider } from "@/hooks/use-bank-payment";
import { PaymentConfirmationProvider } from "@/components/bank-payment/payment-confirmation-provider";
import { GamificationGlobalUI } from "@/components/gamification";
import { ResponsiveLayout } from "@/components/layout";
import { PlanFeaturesProvider } from "@/hooks/use-plan-features";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

import { WalletOnboarding } from "@/components/onboarding/wallet-onboarding";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { completedGoal, clearCompletedGoal } = useGoals();

  return (
    <>
      {/* Componentes globais */}
      <GamificationGlobalUI />
      {completedGoal && (
        <GoalCompletionCelebration
          goal={completedGoal}
          onComplete={clearCompletedGoal}
        />
      )}

      {/* Onboarding para novos usuários sem carteira */}
      <WalletOnboarding />

      {/* Layout responsivo - mobile ou desktop */}
      <ResponsiveLayout>{children}</ResponsiveLayout>
    </>
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
                        <PlanFeaturesProvider>
                          <PaymentConfirmationProvider />
                          <UpgradeModal />
                          <AppLayoutContent>{children}</AppLayoutContent>
                        </PlanFeaturesProvider>
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
