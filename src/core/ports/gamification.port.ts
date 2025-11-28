// src/core/ports/gamification.port.ts
// Porta de Gamificação - Arquitetura Hexagonal

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'expired';
export type QuestType = 'daily' | 'weekly' | 'monthly';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: string;
  earnedAt?: string;
  isNew?: boolean; // Para animações de conquista recente
}

export interface Level {
  level: number;
  name: string;
  title: string;
  icon: string;
  pointsRequired: number;
  pointsToNext: number;
  benefits: string[];
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
  category: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  type: QuestType;
  status: QuestStatus;
  progress: number;
  target: number;
  expiresAt: string;
  completedAt?: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastActivityDate: string;
  type: 'daily_login' | 'payment_on_time' | 'budget_respected';
}

export interface GamificationStats {
  totalXp: number;
  totalBadges: number;
  totalAchievements: number;
  totalQuestsCompleted: number;
  joinedAt: string;
  lastActivityAt: string;
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
  stats: GamificationStats;
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
  disciplineLevel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert';
  paymentConsistency: 'Irregular' | 'Regular' | 'Muito Regular' | 'Exemplar';
  financialMaturity: number;
  strengths: string[];
  improvements: string[];
  motivationalTip: string;
  nextMilestone?: {
    type: 'level' | 'badge' | 'achievement';
    name: string;
    progress: number;
    target: number;
  };
}

// Input para registrar XP
export interface AddXpInput {
  userId: string;
  action: string;
  xpAmount: number;
  description: string;
  metadata?: Record<string, unknown>;
}

// Input para desbloquear badge
export interface UnlockBadgeInput {
  userId: string;
  badgeId: string;
}

// Input para atualizar progresso de quest
export interface UpdateQuestProgressInput {
  userId: string;
  questId: string;
  progress: number;
}

// Interface do repositório de gamificação
export interface IGamificationRepository {
  // Leitura
  getGamificationData(userId: string): Promise<GamificationData | null>;
  getProfileInsights(userId: string): Promise<ProfileInsights | null>;
  getBadges(userId: string): Promise<Badge[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
  getQuests(userId: string, type?: QuestType): Promise<Quest[]>;
  getRecentXpEvents(userId: string, limit?: number): Promise<XpEvent[]>;
  getLeaderboardPosition(userId: string): Promise<number>;

  // Escrita
  addXp(input: AddXpInput): Promise<{ newTotal: number; leveledUp: boolean; newLevel?: Level }>;
  unlockBadge(input: UnlockBadgeInput): Promise<Badge | null>;
  updateQuestProgress(input: UpdateQuestProgressInput): Promise<Quest | null>;
  completeQuest(userId: string, questId: string): Promise<{ xpEarned: number; quest: Quest }>;
  updateStreak(userId: string, type: Streak['type']): Promise<Streak>;
  resetDailyQuests(userId: string): Promise<void>;

  // Verificações automáticas
  checkAndUnlockBadges(userId: string): Promise<Badge[]>;
  checkAndCompleteAchievements(userId: string): Promise<Achievement[]>;
  refreshQuests(userId: string): Promise<Quest[]>;
}
