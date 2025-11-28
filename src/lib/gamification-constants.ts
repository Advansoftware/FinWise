// src/lib/gamification-constants.ts
// Sistema de Gamificação Global - Constantes e Traduções

export const RARITY_LABELS: Record<string, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  mythic: 'Mítico',
};

export const RARITY_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  common: {
    bg: 'rgba(156, 163, 175, 0.1)',
    text: '#6B7280',
    border: 'rgba(156, 163, 175, 0.3)',
    gradient: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
  },
  rare: {
    bg: 'rgba(59, 130, 246, 0.1)',
    text: '#3B82F6',
    border: 'rgba(59, 130, 246, 0.3)',
    gradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
  },
  epic: {
    bg: 'rgba(139, 92, 246, 0.1)',
    text: '#8B5CF6',
    border: 'rgba(139, 92, 246, 0.3)',
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
  },
  legendary: {
    bg: 'rgba(245, 158, 11, 0.1)',
    text: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.3)',
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
  },
  mythic: {
    bg: 'rgba(236, 72, 153, 0.1)',
    text: '#EC4899',
    border: 'rgba(236, 72, 153, 0.3)',
    gradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
  },
};

export const LEVEL_NAMES: Record<number, { name: string; title: string; icon: string }> = {
  1: { name: 'Iniciante', title: 'Aprendiz Financeiro', icon: '🌱' },
  2: { name: 'Organizador', title: 'Controlador de Gastos', icon: '📊' },
  3: { name: 'Disciplinado', title: 'Guardião do Orçamento', icon: '🎯' },
  4: { name: 'Estrategista', title: 'Mestre do Planejamento', icon: '🧠' },
  5: { name: 'Expert', title: 'Sábio das Finanças', icon: '⚡' },
  6: { name: 'Veterano', title: 'Guru Financeiro', icon: '🏆' },
  7: { name: 'Elite', title: 'Lenda Econômica', icon: '💎' },
  8: { name: 'Mestre', title: 'Senhor das Finanças', icon: '👑' },
  9: { name: 'Grão-Mestre', title: 'Imperador Financeiro', icon: '🌟' },
  10: { name: 'Lenda', title: 'Transcendente', icon: '✨' },
};

// Pontos por nível (progressão exponencial)
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];

// XP por ação
export const XP_REWARDS = {
  // Transações
  ADD_TRANSACTION: 5,
  CATEGORIZE_TRANSACTION: 2,
  FIRST_TRANSACTION_TODAY: 10,

  // Parcelamentos
  PAY_INSTALLMENT: 10,
  PAY_ON_TIME_BONUS: 5,
  COMPLETE_INSTALLMENT: 50,
  LATE_PAYMENT_PENALTY: -2, // por dia

  // Orçamentos
  CREATE_BUDGET: 15,
  STAY_WITHIN_BUDGET: 20,
  PERFECT_BUDGET_MONTH: 100,

  // Metas
  CREATE_GOAL: 10,
  CONTRIBUTE_TO_GOAL: 5,
  COMPLETE_GOAL: 100,

  // Carteiras
  CREATE_WALLET: 10,
  BALANCE_WALLETS: 25,

  // Uso do app
  DAILY_LOGIN: 5,
  WEEKLY_STREAK: 25,
  USE_AI_ASSISTANT: 3,
  IMPORT_TRANSACTIONS: 20,
  VIEW_REPORTS: 5,
  USE_CALCULATOR: 3,

  // Desafios
  COMPLETE_DAILY_QUEST: 15,
  COMPLETE_WEEKLY_CHALLENGE: 50,
  COMPLETE_MONTHLY_CHALLENGE: 150,
};

// Badges disponíveis
export const ALL_BADGES = [
  // Iniciante
  { id: 'first-steps', name: 'Primeiros Passos', description: 'Criou sua primeira transação', icon: '👣', rarity: 'common' as const, category: 'onboarding' },
  { id: 'wallet-creator', name: 'Organizador', description: 'Criou sua primeira carteira', icon: '💼', rarity: 'common' as const, category: 'onboarding' },
  { id: 'budget-starter', name: 'Planejador Iniciante', description: 'Criou seu primeiro orçamento', icon: '📋', rarity: 'common' as const, category: 'onboarding' },
  { id: 'goal-setter', name: 'Sonhador', description: 'Definiu sua primeira meta', icon: '🎯', rarity: 'common' as const, category: 'onboarding' },

  // Consistência
  { id: 'week-streak', name: 'Semana Perfeita', description: '7 dias usando o app', icon: '📅', rarity: 'common' as const, category: 'consistency' },
  { id: 'month-streak', name: 'Mês Dedicado', description: '30 dias usando o app', icon: '🗓️', rarity: 'rare' as const, category: 'consistency' },
  { id: 'quarter-streak', name: 'Trimestre Focado', description: '90 dias usando o app', icon: '📆', rarity: 'epic' as const, category: 'consistency' },
  { id: 'year-streak', name: 'Ano de Compromisso', description: '365 dias usando o app', icon: '🎊', rarity: 'legendary' as const, category: 'consistency' },

  // Pagamentos
  { id: 'first-payment', name: 'Pagador', description: 'Pagou sua primeira parcela', icon: '💳', rarity: 'common' as const, category: 'payments' },
  { id: 'punctual-10', name: 'Pontual', description: '10 pagamentos em dia', icon: '⏰', rarity: 'rare' as const, category: 'payments' },
  { id: 'punctual-50', name: 'Super Pontual', description: '50 pagamentos em dia', icon: '⏱️', rarity: 'epic' as const, category: 'payments' },
  { id: 'punctual-100', name: 'Mestre da Pontualidade', description: '100 pagamentos em dia', icon: '🕐', rarity: 'legendary' as const, category: 'payments' },
  { id: 'zero-delay', name: 'Impecável', description: 'Nunca atrasou um pagamento (mín. 20)', icon: '✨', rarity: 'mythic' as const, category: 'payments' },

  // Parcelamentos
  { id: 'installment-complete-1', name: 'Finalizador', description: 'Completou 1 parcelamento', icon: '🏁', rarity: 'common' as const, category: 'installments' },
  { id: 'installment-complete-5', name: 'Quitador', description: 'Completou 5 parcelamentos', icon: '🎖️', rarity: 'rare' as const, category: 'installments' },
  { id: 'installment-complete-15', name: 'Livre de Dívidas', description: 'Completou 15 parcelamentos', icon: '🏆', rarity: 'epic' as const, category: 'installments' },
  { id: 'installment-complete-30', name: 'Destruidor de Dívidas', description: 'Completou 30 parcelamentos', icon: '💪', rarity: 'legendary' as const, category: 'installments' },

  // Orçamentos
  { id: 'budget-success-1', name: 'Controlado', description: 'Ficou dentro do orçamento 1 mês', icon: '📊', rarity: 'common' as const, category: 'budgets' },
  { id: 'budget-success-3', name: 'Disciplinado', description: 'Ficou dentro do orçamento 3 meses', icon: '📈', rarity: 'rare' as const, category: 'budgets' },
  { id: 'budget-success-6', name: 'Mestre do Controle', description: 'Ficou dentro do orçamento 6 meses', icon: '🎯', rarity: 'epic' as const, category: 'budgets' },
  { id: 'budget-success-12', name: 'Rei do Orçamento', description: 'Ficou dentro do orçamento 12 meses', icon: '👑', rarity: 'legendary' as const, category: 'budgets' },

  // Metas
  { id: 'goal-complete-1', name: 'Realizador', description: 'Completou 1 meta', icon: '🌟', rarity: 'common' as const, category: 'goals' },
  { id: 'goal-complete-5', name: 'Conquistador', description: 'Completou 5 metas', icon: '⭐', rarity: 'rare' as const, category: 'goals' },
  { id: 'goal-complete-10', name: 'Campeão de Metas', description: 'Completou 10 metas', icon: '🏅', rarity: 'epic' as const, category: 'goals' },
  { id: 'goal-1000', name: 'Poupador Bronze', description: 'Economizou R$ 1.000', icon: '🥉', rarity: 'common' as const, category: 'goals' },
  { id: 'goal-5000', name: 'Poupador Prata', description: 'Economizou R$ 5.000', icon: '🥈', rarity: 'rare' as const, category: 'goals' },
  { id: 'goal-10000', name: 'Poupador Ouro', description: 'Economizou R$ 10.000', icon: '🥇', rarity: 'epic' as const, category: 'goals' },
  { id: 'goal-50000', name: 'Poupador Diamante', description: 'Economizou R$ 50.000', icon: '💎', rarity: 'legendary' as const, category: 'goals' },

  // Economia
  { id: 'saver-month', name: 'Econômico', description: 'Gastou menos que o mês anterior', icon: '📉', rarity: 'common' as const, category: 'savings' },
  { id: 'saver-10percent', name: 'Poupador 10%', description: 'Economizou 10% da renda', icon: '💰', rarity: 'rare' as const, category: 'savings' },
  { id: 'saver-20percent', name: 'Poupador 20%', description: 'Economizou 20% da renda', icon: '💵', rarity: 'epic' as const, category: 'savings' },
  { id: 'saver-30percent', name: 'Investidor Nato', description: 'Economizou 30% da renda', icon: '🤑', rarity: 'legendary' as const, category: 'savings' },

  // Especiais
  { id: 'no-spend-day', name: 'Dia Econômico', description: 'Passou um dia sem gastar', icon: '🙅', rarity: 'common' as const, category: 'special' },
  { id: 'no-spend-week', name: 'Semana Frugal', description: 'Passou uma semana gastando pouco', icon: '🧘', rarity: 'rare' as const, category: 'special' },
  { id: 'early-bird', name: 'Madrugador', description: 'Usou o app antes das 6h', icon: '🌅', rarity: 'common' as const, category: 'special' },
  { id: 'night-owl', name: 'Coruja', description: 'Usou o app depois da meia-noite', icon: '🦉', rarity: 'common' as const, category: 'special' },
  { id: 'ai-friend', name: 'Amigo da IA', description: 'Usou o assistente de IA 50 vezes', icon: '🤖', rarity: 'rare' as const, category: 'special' },
  { id: 'tool-master', name: 'Calculista', description: 'Usou todas as calculadoras', icon: '🧮', rarity: 'rare' as const, category: 'special' },
  { id: 'report-lover', name: 'Analista', description: 'Gerou 10 relatórios', icon: '📑', rarity: 'rare' as const, category: 'special' },

  // Recuperação
  { id: 'comeback', name: 'Volta por Cima', description: 'Quitou parcelas em atraso', icon: '💪', rarity: 'rare' as const, category: 'recovery' },
  { id: 'debt-free', name: 'Livre!', description: 'Zerou todas as dívidas', icon: '🎉', rarity: 'epic' as const, category: 'recovery' },
];

// Desafios diários possíveis
export const DAILY_QUESTS = [
  { id: 'add-transaction', name: 'Registrar Hoje', description: 'Adicione uma transação hoje', xp: 15, icon: '📝' },
  { id: 'check-budgets', name: 'Revisar Orçamentos', description: 'Visualize seus orçamentos', xp: 10, icon: '📊' },
  { id: 'check-goals', name: 'Acompanhar Metas', description: 'Visualize suas metas', xp: 10, icon: '🎯' },
  { id: 'use-ai', name: 'Consultar IA', description: 'Faça uma pergunta ao assistente', xp: 10, icon: '🤖' },
  { id: 'categorize', name: 'Organizar', description: 'Categorize uma transação', xp: 10, icon: '🏷️' },
  { id: 'view-report', name: 'Analisar', description: 'Visualize um relatório', xp: 10, icon: '📈' },
];

// Desafios semanais possíveis
export const WEEKLY_CHALLENGES = [
  { id: 'budget-week', name: 'Semana no Orçamento', description: 'Fique dentro do orçamento por 7 dias', xp: 50, icon: '📋' },
  { id: 'save-week', name: 'Semana Econômica', description: 'Gaste 10% menos que a semana passada', xp: 75, icon: '💰' },
  { id: 'no-unnecessary', name: 'Essencial', description: 'Evite gastos supérfluos por 5 dias', xp: 60, icon: '🎯' },
  { id: 'register-all', name: 'Registrador', description: 'Registre todas as transações da semana', xp: 40, icon: '📝' },
  { id: 'goal-contribution', name: 'Investidor', description: 'Contribua para uma meta 3x na semana', xp: 50, icon: '🎯' },
];

// Desafios mensais possíveis
export const MONTHLY_CHALLENGES = [
  { id: 'perfect-month', name: 'Mês Perfeito', description: 'Complete todos os desafios diários do mês', xp: 200, icon: '🏆' },
  { id: 'budget-master', name: 'Mestre do Orçamento', description: 'Fique dentro do orçamento o mês inteiro', xp: 150, icon: '👑' },
  { id: 'save-goal', name: 'Meta Alcançada', description: 'Complete uma meta de economia', xp: 150, icon: '🎯' },
  { id: 'debt-reduction', name: 'Redutor de Dívidas', description: 'Pague todas as parcelas do mês em dia', xp: 100, icon: '💳' },
  { id: 'categorize-all', name: 'Organizador Total', description: 'Categorize 100% das transações', xp: 100, icon: '🏷️' },
];

// Função para obter label de raridade em português
export function getRarityLabel(rarity: string): string {
  return RARITY_LABELS[rarity] || rarity;
}

// Função para obter cores de raridade
export function getRarityColors(rarity: string) {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
}

// Função para obter info do nível
export function getLevelInfo(level: number) {
  return LEVEL_NAMES[Math.min(level, 10)] || LEVEL_NAMES[10];
}

// Função para calcular nível baseado em XP
export function calculateLevel(xp: number): { level: number; currentXp: number; xpForNext: number; progress: number } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1000;
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return {
    level,
    currentXp: xpInLevel,
    xpForNext: xpNeeded,
    progress: Math.min((xpInLevel / xpNeeded) * 100, 100),
  };
}
