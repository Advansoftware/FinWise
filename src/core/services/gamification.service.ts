// src/core/services/gamification.service.ts
// Serviço de Gamificação - Lógica de negócio centralizada

import {
  XP_REWARDS,
  ALL_BADGES,
  LEVEL_THRESHOLDS,
  LEVEL_NAMES,
  DAILY_QUESTS,
  WEEKLY_CHALLENGES,
  MONTHLY_CHALLENGES,
  calculateLevel,
  getLevelInfo,
} from '@/lib/gamification-constants';
import type { Badge, Level, Quest, QuestType, Achievement, XpEvent, ProfileInsights } from '@/core/ports/gamification.port';

// Calcula o nível baseado nos pontos
export function calculateUserLevel(points: number): Level {
  const { level, currentXp, xpForNext, progress } = calculateLevel(points);
  const levelInfo = getLevelInfo(level);

  return {
    level,
    name: levelInfo.name,
    title: levelInfo.title,
    icon: levelInfo.icon,
    pointsRequired: LEVEL_THRESHOLDS[level - 1] || 0,
    pointsToNext: xpForNext - currentXp,
    benefits: getLevelBenefits(level),
  };
}

// Benefícios por nível
function getLevelBenefits(level: number): string[] {
  const benefits: Record<number, string[]> = {
    1: ['Acesso ao sistema básico', 'Controle de transações'],
    2: ['Relatórios mensais', 'Notificações de vencimento'],
    3: ['Insights de gastos', 'Dashboard expandido'],
    4: ['Projeções financeiras', 'Metas avançadas'],
    5: ['Análise por IA', 'Recomendações personalizadas'],
    6: ['Relatórios detalhados', 'Exportação de dados'],
    7: ['Acesso antecipado', 'Recursos beta'],
    8: ['Suporte prioritário', 'Consultoria IA'],
    9: ['Funcionalidades exclusivas', 'Badge especial'],
    10: ['Status Lenda', 'Todas as funcionalidades'],
  };

  return benefits[level] || benefits[10];
}

// Verifica se um badge deve ser desbloqueado
export function checkBadgeEligibility(
  badgeId: string,
  stats: {
    totalTransactions: number;
    totalPayments: number;
    onTimePayments: number;
    completedInstallments: number;
    completedGoals: number;
    totalSaved: number;
    budgetsRespected: number;
    loginStreak: number;
    aiUsageCount: number;
    reportsGenerated: number;
    calculatorsUsed: string[];
    latestPaymentDelay: number; // 0 se nunca atrasou
  }
): boolean {
  const badge = ALL_BADGES.find(b => b.id === badgeId);
  if (!badge) return false;

  const checks: Record<string, () => boolean> = {
    // Onboarding
    'first-steps': () => stats.totalTransactions >= 1,
    'wallet-creator': () => true, // Verificado em outro lugar
    'budget-starter': () => true, // Verificado em outro lugar
    'goal-setter': () => true, // Verificado em outro lugar

    // Consistência
    'week-streak': () => stats.loginStreak >= 7,
    'month-streak': () => stats.loginStreak >= 30,
    'quarter-streak': () => stats.loginStreak >= 90,
    'year-streak': () => stats.loginStreak >= 365,

    // Pagamentos
    'first-payment': () => stats.totalPayments >= 1,
    'punctual-10': () => stats.onTimePayments >= 10,
    'punctual-50': () => stats.onTimePayments >= 50,
    'punctual-100': () => stats.onTimePayments >= 100,
    'zero-delay': () => stats.totalPayments >= 20 && stats.latestPaymentDelay === 0,

    // Parcelamentos
    'installment-complete-1': () => stats.completedInstallments >= 1,
    'installment-complete-5': () => stats.completedInstallments >= 5,
    'installment-complete-15': () => stats.completedInstallments >= 15,
    'installment-complete-30': () => stats.completedInstallments >= 30,

    // Orçamentos
    'budget-success-1': () => stats.budgetsRespected >= 1,
    'budget-success-3': () => stats.budgetsRespected >= 3,
    'budget-success-6': () => stats.budgetsRespected >= 6,
    'budget-success-12': () => stats.budgetsRespected >= 12,

    // Metas
    'goal-complete-1': () => stats.completedGoals >= 1,
    'goal-complete-5': () => stats.completedGoals >= 5,
    'goal-complete-10': () => stats.completedGoals >= 10,
    'goal-1000': () => stats.totalSaved >= 1000,
    'goal-5000': () => stats.totalSaved >= 5000,
    'goal-10000': () => stats.totalSaved >= 10000,
    'goal-50000': () => stats.totalSaved >= 50000,

    // Especiais
    'ai-friend': () => stats.aiUsageCount >= 50,
    'tool-master': () => stats.calculatorsUsed.length >= 9,
    'report-lover': () => stats.reportsGenerated >= 10,
    'comeback': () => stats.latestPaymentDelay > 0 && stats.onTimePayments > 0,
  };

  const check = checks[badgeId];
  return check ? check() : false;
}

// Gera quests diárias
export function generateDailyQuests(userId: string): Quest[] {
  const today = new Date();
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Seleciona 3 quests aleatórias
  const shuffled = [...DAILY_QUESTS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  return selected.map(quest => ({
    id: `daily_${quest.id}_${today.toISOString().split('T')[0]}`,
    name: quest.name,
    description: quest.description,
    icon: quest.icon,
    xp: quest.xp,
    type: 'daily' as QuestType,
    status: 'available' as const,
    progress: 0,
    target: 1,
    expiresAt: endOfDay.toISOString(),
  }));
}

// Gera quest semanal
export function generateWeeklyQuest(): Quest {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  const randomChallenge = WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)];

  return {
    id: `weekly_${randomChallenge.id}_${today.toISOString().split('T')[0]}`,
    name: randomChallenge.name,
    description: randomChallenge.description,
    icon: randomChallenge.icon,
    xp: randomChallenge.xp,
    type: 'weekly',
    status: 'available',
    progress: 0,
    target: 7, // Geralmente baseado em dias ou ações
    expiresAt: endOfWeek.toISOString(),
  };
}

// Gera quest mensal
export function generateMonthlyQuest(): Quest {
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const randomChallenge = MONTHLY_CHALLENGES[Math.floor(Math.random() * MONTHLY_CHALLENGES.length)];

  return {
    id: `monthly_${randomChallenge.id}_${today.toISOString().split('T')[0]}`,
    name: randomChallenge.name,
    description: randomChallenge.description,
    icon: randomChallenge.icon,
    xp: randomChallenge.xp,
    type: 'monthly',
    status: 'available',
    progress: 0,
    target: 30, // Baseado no mês
    expiresAt: endOfMonth.toISOString(),
  };
}

// Calcula insights do perfil
export function calculateProfileInsights(
  gamificationData: {
    points: number;
    level: Level;
    badges: Badge[];
    achievements: Achievement[];
    streaks: { login: { current: number }; payments: { current: number }; budget: { current: number } };
    completionRate: number;
  }
): ProfileInsights {
  const { points, level, badges, achievements, streaks, completionRate } = gamificationData;

  // Nível de disciplina
  let disciplineLevel: ProfileInsights['disciplineLevel'];
  if (level.level >= 8) disciplineLevel = 'Expert';
  else if (level.level >= 5) disciplineLevel = 'Avançado';
  else if (level.level >= 3) disciplineLevel = 'Intermediário';
  else disciplineLevel = 'Iniciante';

  // Consistência de pagamentos
  let paymentConsistency: ProfileInsights['paymentConsistency'];
  if (streaks.payments.current >= 12) paymentConsistency = 'Exemplar';
  else if (streaks.payments.current >= 6) paymentConsistency = 'Muito Regular';
  else if (streaks.payments.current >= 3) paymentConsistency = 'Regular';
  else paymentConsistency = 'Irregular';

  // Maturidade financeira (0-100)
  const financialMaturity = Math.min(100, Math.round(
    (level.level * 10) +
    (badges.length * 2) +
    (completionRate * 0.3) +
    (streaks.login.current * 0.5)
  ));

  // Pontos fortes
  const strengths: string[] = [];
  if (completionRate >= 90) strengths.push('Excelente taxa de conclusão');
  if (streaks.payments.current >= 6) strengths.push('Pagamentos sempre em dia');
  if (streaks.budget.current >= 3) strengths.push('Controle de orçamento');
  if (badges.length >= 10) strengths.push('Colecionador de conquistas');
  if (level.level >= 5) strengths.push('Experiência financeira');
  if (strengths.length === 0) strengths.push('Determinação para melhorar');

  // Áreas de melhoria
  const improvements: string[] = [];
  if (completionRate < 80) improvements.push('Completar mais parcelamentos');
  if (streaks.payments.current < 3) improvements.push('Manter pagamentos em dia');
  if (badges.length < 5) improvements.push('Explorar mais funcionalidades');
  if (level.level < 3) improvements.push('Usar o app regularmente');
  if (improvements.length === 0) improvements.push('Continue assim!');

  // Dica motivacional
  let motivationalTip: string;
  if (financialMaturity >= 80) {
    motivationalTip = '🏆 Parabéns! Você tem um perfil financeiro exemplar!';
  } else if (financialMaturity >= 60) {
    motivationalTip = '💪 Ótimo trabalho! Pequenos ajustes podem te levar ao topo!';
  } else if (financialMaturity >= 40) {
    motivationalTip = '📈 Você está progredindo bem. Foque na consistência!';
  } else {
    motivationalTip = '🌱 Todo expert começou como iniciante. Continue praticando!';
  }

  // Próximo marco
  const nextMilestone = calculateNextMilestone(points, badges, achievements);

  return {
    disciplineLevel,
    paymentConsistency,
    financialMaturity,
    strengths,
    improvements,
    motivationalTip,
    nextMilestone,
  };
}

// Calcula próximo marco a ser alcançado
function calculateNextMilestone(
  points: number,
  badges: Badge[],
  achievements: Achievement[]
): ProfileInsights['nextMilestone'] {
  const { level } = calculateLevel(points);

  // Próximo nível
  if (level < 10) {
    const nextThreshold = LEVEL_THRESHOLDS[level];
    const progress = points - LEVEL_THRESHOLDS[level - 1];
    const target = nextThreshold - LEVEL_THRESHOLDS[level - 1];

    return {
      type: 'level',
      name: `Nível ${level + 1} - ${LEVEL_NAMES[level + 1]?.name || 'Próximo'}`,
      progress,
      target,
    };
  }

  // Próxima conquista
  const incompleteAchievement = achievements.find(a => !a.isCompleted);
  if (incompleteAchievement) {
    return {
      type: 'achievement',
      name: incompleteAchievement.name,
      progress: incompleteAchievement.progress,
      target: incompleteAchievement.target,
    };
  }

  // Badge não conquistada
  const earnedBadgeIds = new Set(badges.map(b => b.id));
  const nextBadge = ALL_BADGES.find(b => !earnedBadgeIds.has(b.id));
  if (nextBadge) {
    return {
      type: 'badge',
      name: nextBadge.name,
      progress: 0,
      target: 1,
    };
  }

  return undefined;
}

// Gera mensagem de XP ganho
export function formatXpEventMessage(action: string, xp: number): string {
  const messages: Record<string, string> = {
    ADD_TRANSACTION: 'Transação registrada',
    CATEGORIZE_TRANSACTION: 'Transação categorizada',
    FIRST_TRANSACTION_TODAY: 'Primeira transação do dia',
    PAY_INSTALLMENT: 'Parcela paga',
    PAY_ON_TIME_BONUS: 'Bônus de pontualidade',
    COMPLETE_INSTALLMENT: 'Parcelamento quitado',
    CREATE_BUDGET: 'Orçamento criado',
    STAY_WITHIN_BUDGET: 'Dentro do orçamento',
    PERFECT_BUDGET_MONTH: 'Mês perfeito de orçamento',
    CREATE_GOAL: 'Meta criada',
    CONTRIBUTE_TO_GOAL: 'Contribuição para meta',
    COMPLETE_GOAL: 'Meta alcançada',
    CREATE_WALLET: 'Carteira criada',
    DAILY_LOGIN: 'Login diário',
    WEEKLY_STREAK: 'Sequência semanal',
    USE_AI_ASSISTANT: 'Assistente IA usado',
    COMPLETE_DAILY_QUEST: 'Missão diária completa',
    COMPLETE_WEEKLY_CHALLENGE: 'Desafio semanal completo',
    COMPLETE_MONTHLY_CHALLENGE: 'Desafio mensal completo',
  };

  return messages[action] || action;
}

// Obter ícone para ação de XP
export function getXpActionIcon(action: string): string {
  const icons: Record<string, string> = {
    ADD_TRANSACTION: '💳',
    CATEGORIZE_TRANSACTION: '🏷️',
    FIRST_TRANSACTION_TODAY: '🌅',
    PAY_INSTALLMENT: '💰',
    PAY_ON_TIME_BONUS: '⏰',
    COMPLETE_INSTALLMENT: '🎉',
    CREATE_BUDGET: '📊',
    STAY_WITHIN_BUDGET: '✅',
    PERFECT_BUDGET_MONTH: '🏆',
    CREATE_GOAL: '🎯',
    CONTRIBUTE_TO_GOAL: '📈',
    COMPLETE_GOAL: '🌟',
    CREATE_WALLET: '💼',
    DAILY_LOGIN: '📅',
    WEEKLY_STREAK: '🔥',
    USE_AI_ASSISTANT: '🤖',
    COMPLETE_DAILY_QUEST: '✨',
    COMPLETE_WEEKLY_CHALLENGE: '🏅',
    COMPLETE_MONTHLY_CHALLENGE: '👑',
  };

  return icons[action] || '⭐';
}
