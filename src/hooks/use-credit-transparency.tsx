// src/hooks/use-credit-transparency.tsx
"use client";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { useAISettings } from "@/hooks/use-ai-settings";
import { useState, useCallback } from "react";
import { Box, Typography, Stack } from "@mui/material";

export interface CreditAction {
  name: string;
  cost: number;
  description: string;
  category: "simple" | "complex" | "image";
}

const CREDIT_ACTIONS: Record<string, CreditAction> = {
  "spending-tip": {
    name: "Dica Rápida",
    cost: 1,
    description: "Análise rápida para gerar uma dica personalizada",
    category: "simple",
  },
  "chat-simple": {
    name: "Chat - Pergunta Simples",
    cost: 1,
    description: "Resposta a perguntas básicas e cumprimentos",
    category: "simple",
  },
  "chat-complex": {
    name: "Chat - Pergunta Complexa",
    cost: 5,
    description: "Análise detalhada e cálculos complexos",
    category: "complex",
  },
  "category-suggestion": {
    name: "Sugestão de Categoria",
    cost: 1,
    description: "Sugestão automática de categoria para transação",
    category: "simple",
  },
  "financial-profile": {
    name: "Perfil Financeiro",
    cost: 5,
    description: "Análise completa do seu comportamento financeiro",
    category: "complex",
  },
  "transaction-analysis": {
    name: "Análise de Transações",
    cost: 5,
    description: "Análise detalhada de um grupo de transações",
    category: "complex",
  },
  "monthly-report": {
    name: "Relatório Mensal",
    cost: 5,
    description: "Geração de relatório mensal com insights",
    category: "complex",
  },
  "annual-report": {
    name: "Relatório Anual",
    cost: 5,
    description: "Relatório completo do ano com tendências",
    category: "complex",
  },
  "budget-suggestion": {
    name: "Sugestão de Orçamento",
    cost: 2,
    description: "Recomendação personalizada de valor para orçamento",
    category: "simple",
  },
  "goal-projection": {
    name: "Projeção de Meta",
    cost: 2,
    description: "Cálculo de tempo para alcançar suas metas",
    category: "simple",
  },
  "automatic-budgets": {
    name: "Orçamentos Automáticos",
    cost: 5,
    description: "Criação automática de orçamentos baseados no histórico",
    category: "complex",
  },
  "balance-prediction": {
    name: "Previsão de Saldo",
    cost: 5,
    description: "Projeção de saldo futuro baseado em padrões",
    category: "complex",
  },
  "receipt-scan": {
    name: "Escanear Nota Fiscal",
    cost: 10,
    description: "Processamento de imagem e extração de dados (OCR)",
    category: "image",
  },
};

export function useCreditTransparency() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan, isPlus, isInfinity } = usePlan();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const [isShowingCostDialog, setIsShowingCostDialog] = useState(false);

  const activeCredential = displayedCredentials.find(
    (c) => c.id === activeCredentialId
  );

  const isUsingGastometriaAI = useCallback(() => {
    return (
      activeCredential?.id === "gastometria-ai-default" ||
      activeCredential?.provider === "gastometria" ||
      !activeCredential
    );
  }, [activeCredential]);

  const willConsumeCredits = useCallback(() => {
    return isUsingGastometriaAI();
  }, [isUsingGastometriaAI]);

  const getAlternativeMessage = useCallback(() => {
    if (plan === "Básico") {
      return "💡 Upgrade para Plus para usar Ollama local ilimitado, ou Infinity para usar qualquer provedor de IA.";
    }
    if (isPlus) {
      return "💡 Configure Ollama local nas suas credenciais de IA para uso ilimitado e gratuito.";
    }
    if (isInfinity) {
      return "💡 Configure suas próprias credenciais de IA (OpenAI, Google, Ollama) para uso ilimitado e gratuito.";
    }
    return "";
  }, [plan, isPlus, isInfinity]);

  const notifyBeforeAction = useCallback(
    (actionKey: string) => {
      const action = CREDIT_ACTIONS[actionKey];
      if (!action || !willConsumeCredits()) return Promise.resolve(true);

      return new Promise<boolean>((resolve) => {
        const categoryEmoji = {
          simple: "⚡",
          complex: "🧠",
          image: "🔍",
        };

        toast({
          title: `${categoryEmoji[action.category]} ${action.name}`,
          description: (
            <Stack spacing={1}>
              <Typography variant="body2">
                <Box component="strong">{action.cost} créditos</Box> -{" "}
                {action.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getAlternativeMessage()}
              </Typography>
            </Stack>
          ),
          duration: 3000,
        });

        // Auto-resolve after showing notification
        setTimeout(() => resolve(true), 500);
      });
    },
    [willConsumeCredits, getAlternativeMessage, toast]
  );

  const notifyAfterAction = useCallback(
    (actionKey: string, success: boolean = true) => {
      const action = CREDIT_ACTIONS[actionKey];
      if (!action || !willConsumeCredits()) return;

      if (success) {
        toast({
          title: "✅ Ação Concluída",
          description: `${action.cost} créditos utilizados para: ${action.name}`,
          duration: 2000,
        });
      }
    },
    [willConsumeCredits, toast]
  );

  const showCreditInfo = useCallback(() => {
    const currentCredits = user?.aiCredits || 0;
    const planCredits = {
      Básico: 0,
      Pro: 100,
      Plus: 300,
      Infinity: 500,
    };

    toast({
      title: "💎 Seus Créditos de IA",
      description: (
        <Stack spacing={1}>
          <Typography variant="body2">
            <Box component="strong">{currentCredits} créditos</Box> disponíveis
          </Typography>
          <Typography variant="body2">
            Plano {plan}: {planCredits[plan]} créditos/mês
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {getAlternativeMessage()}
          </Typography>
        </Stack>
      ),
      duration: 5000,
    });
  }, [user, plan, getAlternativeMessage, toast]);

  const getCreditBadgeInfo = useCallback(
    (actionKey: string) => {
      const action = CREDIT_ACTIONS[actionKey];
      if (!action || !willConsumeCredits()) {
        return {
          show: false,
          cost: 0,
          category: "simple" as const,
          willCharge: false,
        };
      }

      return {
        show: true,
        cost: action.cost,
        category: action.category,
        willCharge: true,
      };
    },
    [willConsumeCredits]
  );

  return {
    // Core functions
    notifyBeforeAction,
    notifyAfterAction,
    showCreditInfo,
    getCreditBadgeInfo,

    // State checks
    willConsumeCredits: willConsumeCredits(),
    isUsingGastometriaAI: isUsingGastometriaAI(),

    // Helper info
    getAlternativeMessage,
    currentCredits: user?.aiCredits || 0,
    plan,

    // Available actions
    actions: CREDIT_ACTIONS,
  };
}
