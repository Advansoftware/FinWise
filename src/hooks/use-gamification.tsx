// src/hooks/use-gamification.tsx
// Hook de Gamificação Global - Sistema completo de gamificação

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useAuth } from "./use-auth";
import { useDataRefresh } from "./use-data-refresh";
import {
  XP_REWARDS,
  LEVEL_NAMES,
  getRarityLabel,
  getRarityColors,
  calculateLevel,
  getLevelInfo,
} from "@/lib/gamification-constants";
import type { GamificationData as LegacyGamificationData } from "@/core/ports/installments.port";

// Tipos expandidos para o sistema de gamificação
export type BadgeRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  earnedAt?: string;
  isNew?: boolean;
}

export interface Level {
  level: number;
  name: string;
  title: string;
  icon: string;
  pointsRequired: number;
  pointsToNext: number;
  benefits: string[];
  description?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: string;
  points: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  type: "daily" | "weekly" | "monthly";
  status: "available" | "in_progress" | "completed" | "expired";
  progress: number;
  target: number;
  expiresAt: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastActivityDate: string;
  type: "daily_login" | "payment_on_time" | "budget_respected";
}

export interface GamificationData {
  userId: string;
  points: number;
  level: Level;
  badges: Badge[];
  achievements: Achievement[];
  quests: Quest[];
  streaks: {
    login: Streak;
    payments: Streak;
    budget: Streak;
  };
  stats: {
    totalXp: number;
    totalBadges: number;
    totalAchievements: number;
    totalQuestsCompleted: number;
    joinedAt: string;
    lastActivityAt: string;
  };
  completionRate: number;
  financialHealthScore: number;
  recentActivity: XpEvent[];
}

export interface XpEvent {
  id: string;
  action: string;
  xpAmount: number;
  timestamp: string;
  description: string;
  icon: string;
}

export interface ProfileInsights {
  disciplineLevel: "Iniciante" | "Intermediário" | "Avançado" | "Expert";
  paymentConsistency: "Irregular" | "Regular" | "Muito Regular" | "Exemplar";
  financialMaturity: number;
  strengths: string[];
  improvements: string[];
  motivationalTip: string;
  nextMilestone?: {
    type: "level" | "badge" | "achievement";
    name: string;
    progress: number;
    target: number;
  };
}

// Tipo para notificação de XP
export interface XpNotification {
  id: string;
  action: string;
  xp: number;
  message: string;
  icon: string;
  timestamp: number;
}

// Tipo para evento de level up
export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  levelInfo: { name: string; title: string; icon: string };
}

// Tipo para evento de badge desbloqueada
export interface BadgeUnlockEvent {
  badge: Badge;
}

interface GamificationContextType {
  // Dados principais
  gamificationData: GamificationData | null;
  profileInsights: ProfileInsights | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadGamification: () => Promise<void>;

  // Notificações de XP
  xpNotifications: XpNotification[];
  clearXpNotification: (id: string) => void;

  // Eventos de level up
  levelUpEvent: LevelUpEvent | null;
  clearLevelUpEvent: () => void;

  // Eventos de badges
  newBadgeEvent: BadgeUnlockEvent | null;
  clearNewBadgeEvent: () => void;

  // Ações
  refresh: () => Promise<void>;
  addXp: (
    action: keyof typeof XP_REWARDS,
    customMessage?: string
  ) => Promise<void>;
  checkBadges: () => Promise<Badge[]>;
  completeQuest: (questId: string) => Promise<void>;

  // Helpers
  getRarityLabel: (rarity: string) => string;
  getRarityColors: (rarity: string) => ReturnType<typeof getRarityColors>;
  getLevelInfo: (level: number) => ReturnType<typeof getLevelInfo>;
  calculateProgress: () => { current: number; next: number; progress: number };
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

// Mensagens de ações
const ACTION_MESSAGES: Record<string, string> = {
  ADD_TRANSACTION: "Transação registrada",
  CATEGORIZE_TRANSACTION: "Transação categorizada",
  FIRST_TRANSACTION_TODAY: "Primeira transação do dia",
  PAY_INSTALLMENT: "Parcela paga",
  PAY_ON_TIME_BONUS: "Bônus de pontualidade",
  COMPLETE_INSTALLMENT: "Parcelamento quitado",
  LATE_PAYMENT_PENALTY: "Atraso no pagamento",
  CREATE_BUDGET: "Orçamento criado",
  STAY_WITHIN_BUDGET: "Dentro do orçamento",
  PERFECT_BUDGET_MONTH: "Mês perfeito!",
  CREATE_GOAL: "Meta criada",
  CONTRIBUTE_TO_GOAL: "Contribuição para meta",
  COMPLETE_GOAL: "Meta alcançada!",
  CREATE_WALLET: "Carteira criada",
  BALANCE_WALLETS: "Carteiras balanceadas",
  DAILY_LOGIN: "Login diário",
  WEEKLY_STREAK: "Sequência semanal",
  USE_AI_ASSISTANT: "Assistente IA usado",
  IMPORT_TRANSACTIONS: "Transações importadas",
  VIEW_REPORTS: "Relatório visualizado",
  USE_CALCULATOR: "Calculadora usada",
  COMPLETE_DAILY_QUEST: "Missão diária completa",
  COMPLETE_WEEKLY_CHALLENGE: "Desafio semanal completo",
  COMPLETE_MONTHLY_CHALLENGE: "Desafio mensal completo",
};

// Ícones de ações
const ACTION_ICONS: Record<string, string> = {
  ADD_TRANSACTION: "💳",
  CATEGORIZE_TRANSACTION: "🏷️",
  FIRST_TRANSACTION_TODAY: "🌅",
  PAY_INSTALLMENT: "💰",
  PAY_ON_TIME_BONUS: "⏰",
  COMPLETE_INSTALLMENT: "🎉",
  LATE_PAYMENT_PENALTY: "⚠️",
  CREATE_BUDGET: "📊",
  STAY_WITHIN_BUDGET: "✅",
  PERFECT_BUDGET_MONTH: "🏆",
  CREATE_GOAL: "🎯",
  CONTRIBUTE_TO_GOAL: "📈",
  COMPLETE_GOAL: "🌟",
  CREATE_WALLET: "💼",
  BALANCE_WALLETS: "⚖️",
  DAILY_LOGIN: "📅",
  WEEKLY_STREAK: "🔥",
  USE_AI_ASSISTANT: "🤖",
  IMPORT_TRANSACTIONS: "📥",
  VIEW_REPORTS: "📑",
  USE_CALCULATOR: "🧮",
  COMPLETE_DAILY_QUEST: "✨",
  COMPLETE_WEEKLY_CHALLENGE: "🏅",
  COMPLETE_MONTHLY_CHALLENGE: "👑",
};

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [gamificationData, setGamificationData] =
    useState<GamificationData | null>(null);
  const [profileInsights, setProfileInsights] =
    useState<ProfileInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Use ref to track hasLoaded to avoid recreating loadGamification
  const hasLoadedRef = useRef(hasLoaded);
  hasLoadedRef.current = hasLoaded;

  // Notificações
  const [xpNotifications, setXpNotifications] = useState<XpNotification[]>([]);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [newBadgeEvent, setNewBadgeEvent] = useState<BadgeUnlockEvent | null>(
    null
  );

  const { user, loading: authLoading } = useAuth();
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } =
    useDataRefresh();

  // Ref para evitar notificações duplicadas no login
  const hasInitialLoad = useRef(false);
  const previousPoints = useRef<number | null>(null);

  const fetchGamificationData = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Usa API existente
      const response = await fetch(
        `/api/installments/gamification?userId=${user.uid}`
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar dados de gamificação");
      }

      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Resposta inválida do servidor");
      }

      const legacyData = await response.json();
      const legacyGamification =
        legacyData.gamification as LegacyGamificationData;

      // Adapta dados da API existente para o novo formato
      const levelNum = legacyGamification.level.level;
      const levelInfo = LEVEL_NAMES[levelNum] || LEVEL_NAMES[1];

      const adaptedData: GamificationData = {
        userId: user.uid,
        points: legacyGamification.points,
        level: {
          level: levelNum,
          name: levelInfo.name,
          title: levelInfo.title,
          icon: levelInfo.icon,
          pointsRequired: legacyGamification.level.pointsRequired,
          pointsToNext: legacyGamification.level.pointsToNext,
          benefits: legacyGamification.level.benefits || [],
          description: legacyGamification.level.description,
        },
        badges: legacyGamification.badges.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          rarity: b.rarity,
          earnedAt: b.earnedAt,
          isNew: false,
        })),
        achievements: legacyGamification.achievements.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          progress: a.progress,
          target: a.target,
          isCompleted: a.isCompleted,
          completedAt: a.completedAt,
          points: a.points,
        })),
        quests: [],
        streaks: {
          login: {
            current: 0,
            longest: 0,
            lastActivityDate: new Date().toISOString(),
            type: "daily_login",
          },
          payments: {
            current: legacyGamification.streak,
            longest: legacyGamification.streak,
            lastActivityDate: new Date().toISOString(),
            type: "payment_on_time",
          },
          budget: {
            current: 0,
            longest: 0,
            lastActivityDate: new Date().toISOString(),
            type: "budget_respected",
          },
        },
        stats: {
          totalXp: legacyGamification.points,
          totalBadges: legacyGamification.badges.length,
          totalAchievements: legacyGamification.achievements.filter(
            (a) => a.isCompleted
          ).length,
          totalQuestsCompleted: 0,
          joinedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
        },
        completionRate: legacyGamification.completionRate,
        financialHealthScore: legacyGamification.financialHealthScore || 0,
        recentActivity: [],
      };

      // Detecta level up (só após carga inicial)
      if (hasInitialLoad.current && previousPoints.current !== null) {
        const prevLevel = calculateLevel(previousPoints.current).level;
        const newLevel = calculateLevel(adaptedData.points).level;

        if (newLevel > prevLevel) {
          const newLevelInfo = LEVEL_NAMES[newLevel];
          setLevelUpEvent({
            previousLevel: prevLevel,
            newLevel,
            levelInfo: newLevelInfo || {
              name: "Novo Nível",
              title: "Parabéns!",
              icon: "⭐",
            },
          });
        }
      }

      setGamificationData(adaptedData);
      setProfileInsights(legacyData.profileInsights);
      previousPoints.current = adaptedData.points;
      hasInitialLoad.current = true;
      setHasLoaded(true);
    } catch (err) {
      console.error("Erro ao buscar dados de gamificação:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setGamificationData(null);
      setProfileInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Load gamification data only when needed (lazy loading)
  const loadGamification = useCallback(async () => {
    if (!user?.uid || hasLoadedRef.current) return;
    await fetchGamificationData();
  }, [user?.uid, fetchGamificationData]);

  // Register refresh handler (but don't load immediately)
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setIsLoading(false);
      setHasLoaded(false);
      return;
    }

    // Register this hook's refresh function with the global system
    registerRefreshHandler("gamification", fetchGamificationData);

    return () => {
      unregisterRefreshHandler("gamification");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, authLoading]);

  // Adiciona XP e mostra notificação
  const addXp = useCallback(
    async (action: keyof typeof XP_REWARDS, customMessage?: string) => {
      if (!user?.uid) return;

      const xpAmount = XP_REWARDS[action];
      if (!xpAmount) return;

      const notification: XpNotification = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        xp: xpAmount,
        message: customMessage || ACTION_MESSAGES[action] || action,
        icon: ACTION_ICONS[action] || "⭐",
        timestamp: Date.now(),
      };

      setXpNotifications((prev) => [...prev, notification]);

      // Remove notificação após 4 segundos
      setTimeout(() => {
        setXpNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      }, 4000);

      // Atualiza dados localmente de forma otimista
      if (gamificationData) {
        const newPoints = gamificationData.points + xpAmount;
        const newLevel = calculateLevel(newPoints);
        const newLevelInfo = LEVEL_NAMES[newLevel.level];

        // Detecta level up
        if (newLevel.level > gamificationData.level.level) {
          setLevelUpEvent({
            previousLevel: gamificationData.level.level,
            newLevel: newLevel.level,
            levelInfo: newLevelInfo || {
              name: "Novo Nível",
              title: "Parabéns!",
              icon: "⭐",
            },
          });
        }

        setGamificationData((prev) =>
          prev
            ? {
                ...prev,
                points: newPoints,
                level: {
                  ...prev.level,
                  level: newLevel.level,
                  name: newLevelInfo?.name || prev.level.name,
                  title: newLevelInfo?.title || prev.level.title,
                  icon: newLevelInfo?.icon || prev.level.icon,
                  pointsToNext: newLevel.xpForNext - newLevel.currentXp,
                },
              }
            : null
        );
      }
    },
    [user?.uid, gamificationData]
  );

  // Limpa notificação de XP
  const clearXpNotification = useCallback((id: string) => {
    setXpNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Limpa evento de level up
  const clearLevelUpEvent = useCallback(() => {
    setLevelUpEvent(null);
  }, []);

  // Limpa evento de nova badge
  const clearNewBadgeEvent = useCallback(() => {
    setNewBadgeEvent(null);
  }, []);

  // Verifica badges (placeholder - pode ser expandido)
  const checkBadges = useCallback(async (): Promise<Badge[]> => {
    if (!user?.uid) return [];
    // Recarrega dados para verificar novas badges
    await fetchGamificationData();
    return gamificationData?.badges.filter((b) => b.isNew) || [];
  }, [user?.uid, fetchGamificationData, gamificationData?.badges]);

  // Completa quest (placeholder)
  const completeQuest = useCallback(
    async (questId: string) => {
      if (!user?.uid) return;
      console.log("Quest completed:", questId);
      await fetchGamificationData();
    },
    [user?.uid, fetchGamificationData]
  );

  // Calcula progresso para próximo nível
  const calculateProgressFn = useCallback(() => {
    if (!gamificationData) {
      return { current: 0, next: 100, progress: 0 };
    }

    const { currentXp, xpForNext } = calculateLevel(gamificationData.points);
    return {
      current: currentXp,
      next: xpForNext,
      progress: Math.min((currentXp / xpForNext) * 100, 100),
    };
  }, [gamificationData]);

  // Refresh manual
  const refresh = useCallback(async () => {
    await fetchGamificationData();
    triggerRefresh();
  }, [fetchGamificationData, triggerRefresh]);

  const value: GamificationContextType = {
    gamificationData,
    profileInsights,
    isLoading,
    error,
    hasLoaded,
    loadGamification,
    xpNotifications,
    clearXpNotification,
    levelUpEvent,
    clearLevelUpEvent,
    newBadgeEvent,
    clearNewBadgeEvent,
    refresh,
    addXp,
    checkBadges,
    completeQuest,
    getRarityLabel,
    getRarityColors,
    getLevelInfo,
    calculateProgress: calculateProgressFn,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error(
      "useGamification must be used within a GamificationProvider"
    );
  }
  return context;
}
