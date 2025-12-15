// src/hooks/use-plan-features.tsx
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { usePlan } from "@/hooks/use-plan";
import { UserPlan } from "@/lib/types";

// Features that require specific plans
export type PremiumFeature = 
  | 'open-finance'
  | 'pluggy-connect'
  | 'pix-payment'
  | 'auto-sync'
  | 'advanced-reports';

// Plan requirements for features
const FEATURE_REQUIREMENTS: Record<PremiumFeature, UserPlan[]> = {
  'open-finance': ['Plus', 'Infinity'],
  'pluggy-connect': ['Plus', 'Infinity'],
  'pix-payment': ['Plus', 'Infinity'],
  'auto-sync': ['Plus', 'Infinity'],
  'advanced-reports': ['Pro', 'Plus', 'Infinity'],
};

// Feature display info
export const FEATURE_INFO: Record<PremiumFeature, { title: string; description: string; benefits: string[] }> = {
  'open-finance': {
    title: 'Open Finance',
    description: 'Conecte suas contas bancárias e cartões automaticamente.',
    benefits: [
      'Importe transações automaticamente',
      'Sincronização em tempo real',
      'Suporte a mais de 100 bancos',
      'Categorização automática',
    ],
  },
  'pluggy-connect': {
    title: 'Conexão Bancária',
    description: 'Conecte-se ao seu banco de forma segura e automatizada.',
    benefits: [
      'Conexão segura via Open Finance',
      'Dados criptografados',
      'Regulado pelo Banco Central',
    ],
  },
  'pix-payment': {
    title: 'Pagamento PIX',
    description: 'Pague suas contas e parcelas diretamente pelo app.',
    benefits: [
      'Pagamento direto via PIX',
      'Baixa automática de parcelas',
      'Histórico de pagamentos',
    ],
  },
  'auto-sync': {
    title: 'Sincronização Automática',
    description: 'Suas transações são importadas automaticamente.',
    benefits: [
      'Atualização em tempo real',
      'Sem necessidade de importar manualmente',
      'Notificações de novas transações',
    ],
  },
  'advanced-reports': {
    title: 'Relatórios Avançados',
    description: 'Análises detalhadas das suas finanças.',
    benefits: [
      'Gráficos interativos',
      'Previsões de gastos',
      'Comparação mensal',
    ],
  },
};

interface PlanFeaturesContextType {
  userPlan: UserPlan;
  canUseFeature: (feature: PremiumFeature) => boolean;
  requireUpgrade: (feature: PremiumFeature) => void;
  isUpgradeModalOpen: boolean;
  currentFeature: PremiumFeature | null;
  closeUpgradeModal: () => void;
}

const PlanFeaturesContext = createContext<PlanFeaturesContextType | undefined>(undefined);

export function PlanFeaturesProvider({ children }: { children: ReactNode }) {
  const { plan } = usePlan();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<PremiumFeature | null>(null);

  const userPlan: UserPlan = plan || 'Básico';

  const canUseFeature = useCallback((feature: PremiumFeature): boolean => {
    const requiredPlans = FEATURE_REQUIREMENTS[feature];
    return requiredPlans.includes(userPlan);
  }, [userPlan]);

  const requireUpgrade = useCallback((feature: PremiumFeature) => {
    setCurrentFeature(feature);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
    setCurrentFeature(null);
  }, []);

  return (
    <PlanFeaturesContext.Provider
      value={{
        userPlan,
        canUseFeature,
        requireUpgrade,
        isUpgradeModalOpen,
        currentFeature,
        closeUpgradeModal,
      }}
    >
      {children}
    </PlanFeaturesContext.Provider>
  );
}

export function usePlanFeatures() {
  const context = useContext(PlanFeaturesContext);
  if (context === undefined) {
    throw new Error("usePlanFeatures must be used within a PlanFeaturesProvider");
  }
  return context;
}

// Standalone function for checking without context (for initial renders)
export function checkPlanAccess(plan: UserPlan, feature: PremiumFeature): boolean {
  const requiredPlans = FEATURE_REQUIREMENTS[feature];
  return requiredPlans.includes(plan);
}
