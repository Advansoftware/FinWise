// src/app/api/v1/gamification/route.ts
// Gamification API for Mobile - Returns gamification data for authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';
import { getDatabaseAdapter } from '@/core/services/service-factory';

// Calcula score de saúde financeira
function calculateFinancialHealthScore(gamification: any): number {
  const weights = {
    level: 0.3,
    completionRate: 0.3,
    streak: 0.2,
    badges: 0.2
  };

  const normalizedLevel = Math.min((gamification.level.level / 10) * 100, 100);
  const normalizedCompletion = gamification.completionRate || 0;
  const normalizedStreak = Math.min((gamification.streak / 12) * 100, 100);
  const normalizedBadges = Math.min(((gamification.badges?.length || 0) / 20) * 100, 100);

  const score =
    normalizedLevel * weights.level +
    normalizedCompletion * weights.completionRate +
    normalizedStreak * weights.streak +
    normalizedBadges * weights.badges;

  return Math.round(score);
}

// Gera insights motivacionais
function generateMotivationalInsights(gamification: any): string[] {
  const insights: string[] = [];

  if (gamification.streak >= 6) {
    insights.push(`🔥 Sequência impressionante de ${gamification.streak} meses!`);
  }

  if (gamification.completionRate >= 90) {
    insights.push('🎯 Taxa de conclusão excelente - você é disciplinado!');
  }

  if (gamification.badges?.length >= 5) {
    insights.push(`🏆 ${gamification.badges.length} badges conquistadas - parabéns!`);
  }

  if (gamification.level?.level >= 5) {
    insights.push(`⭐ Nível ${gamification.level.level} - você é experiente!`);
  }

  if (insights.length === 0) {
    insights.push('💪 Continue assim, cada pagamento em dia conta!');
  }

  return insights;
}

// Gera insights do perfil
function generateProfileInsights(gamification: any) {
  const healthScore = calculateFinancialHealthScore(gamification);

  let disciplineLevel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert';
  if (gamification.level?.level >= 8) disciplineLevel = 'Expert';
  else if (gamification.level?.level >= 5) disciplineLevel = 'Avançado';
  else if (gamification.level?.level >= 3) disciplineLevel = 'Intermediário';
  else disciplineLevel = 'Iniciante';

  let paymentConsistency: 'Irregular' | 'Regular' | 'Muito Regular' | 'Exemplar';
  if (gamification.streak >= 12) paymentConsistency = 'Exemplar';
  else if (gamification.streak >= 6) paymentConsistency = 'Muito Regular';
  else if (gamification.streak >= 3) paymentConsistency = 'Regular';
  else paymentConsistency = 'Irregular';

  const strengths: string[] = [];
  if (gamification.completionRate >= 90) strengths.push('Excelente taxa de conclusão de parcelamentos');
  if (gamification.streak >= 6) strengths.push('Consistência exemplar nos pagamentos');
  if (gamification.badges?.length >= 10) strengths.push('Múltiplas conquistas desbloqueadas');
  if (gamification.level?.level >= 5) strengths.push('Alto nível de experiência financeira');

  const improvements: string[] = [];
  if ((gamification.completionRate || 0) < 80) improvements.push('Foque em concluir todos os parcelamentos iniciados');
  if (gamification.streak < 3) improvements.push('Trabalhe na consistência dos pagamentos em dia');
  if ((gamification.badges?.length || 0) < 5) improvements.push('Explore mais funcionalidades para desbloquear badges');
  if (gamification.level?.level < 3) improvements.push('Continue usando o sistema para subir de nível');

  let motivationalTip = '';
  if (healthScore >= 80) {
    motivationalTip = 'Parabéns! Você tem um perfil financeiro exemplar. Continue assim!';
  } else if (healthScore >= 60) {
    motivationalTip = 'Bom trabalho! Pequenos ajustes podem elevar ainda mais seu perfil.';
  } else if (healthScore >= 40) {
    motivationalTip = 'Você está no caminho certo. Foque na consistência dos pagamentos.';
  } else {
    motivationalTip = 'Todo expert já foi iniciante. Continue praticando e os resultados virão!';
  }

  return {
    disciplineLevel,
    paymentConsistency,
    financialMaturity: healthScore,
    strengths: strengths.length > 0 ? strengths : ['Determinação para melhorar suas finanças'],
    improvements: improvements.length > 0 ? improvements : ['Continue praticando para desenvolver novos pontos fortes'],
    motivationalTip
  };
}

// Gera quests diárias baseadas no perfil do usuário
function generateDailyQuests(): any[] {
  const today = new Date();
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return [
    {
      id: 'daily_transaction',
      name: 'Registrar Transação',
      description: 'Adicione uma nova transação hoje',
      icon: '💳',
      xp: 10,
      type: 'daily',
      status: 'available',
      progress: 0,
      target: 1,
      expiresAt: endOfDay.toISOString()
    },
    {
      id: 'daily_check_balance',
      name: 'Verificar Saldo',
      description: 'Visualize o saldo das suas carteiras',
      icon: '💰',
      xp: 5,
      type: 'daily',
      status: 'available',
      progress: 0,
      target: 1,
      expiresAt: endOfDay.toISOString()
    },
    {
      id: 'daily_categorize',
      name: 'Categorizar Transação',
      description: 'Categorize uma transação não classificada',
      icon: '🏷️',
      xp: 15,
      type: 'daily',
      status: 'available',
      progress: 0,
      target: 1,
      expiresAt: endOfDay.toISOString()
    }
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedMobileUser(request);

    if (!user) {
      const status = error?.includes('Forbidden') ? 403 : 401;
      return NextResponse.json({ error }, { status });
    }

    const db = await getDatabaseAdapter();
    const summary = await db.installments.getInstallmentSummary(user.id);

    // Dados padrão para usuário novo
    const defaultGamification = {
      points: 0,
      level: {
        level: 1,
        name: 'Iniciante',
        title: 'Novato Financeiro',
        icon: '🌱',
        description: 'Começando a jornada financeira',
        pointsRequired: 0,
        pointsToNext: 100,
        benefits: ['Acesso ao sistema de gamificação', 'Missões diárias']
      },
      badges: [],
      achievements: [],
      quests: generateDailyQuests(),
      streak: 0,
      completionRate: 0,
      financialHealthScore: 0,
      motivationalInsights: ['💪 Continue assim, cada transação conta!'],
      streaks: {
        login: { current: 0, longest: 0, lastActivityDate: new Date().toISOString(), type: 'daily_login' },
        payments: { current: 0, longest: 0, lastActivityDate: new Date().toISOString(), type: 'payment_on_time' },
        budget: { current: 0, longest: 0, lastActivityDate: new Date().toISOString(), type: 'budget_respected' }
      },
      stats: {
        totalXp: 0,
        totalBadges: 0,
        totalAchievements: 0,
        totalQuestsCompleted: 0,
        joinedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      }
    };

    if (!summary) {
      return NextResponse.json({
        gamification: defaultGamification,
        profileInsights: {
          disciplineLevel: 'Iniciante',
          paymentConsistency: 'Irregular',
          financialMaturity: 0,
          strengths: ['Determinação para melhorar suas finanças'],
          improvements: ['Comece criando seu primeiro parcelamento'],
          motivationalTip: 'Dê o primeiro passo criando seu primeiro parcelamento!'
        }
      });
    }

    const gamification = summary.gamification;

    // Enriquece os dados de gamificação
    const enhancedGamification = {
      points: gamification.points || 0,
      level: {
        level: gamification.level?.level || 1,
        name: gamification.level?.name || 'Iniciante',
        title: getLevelTitle(gamification.level?.level || 1),
        icon: getLevelIcon(gamification.level?.level || 1),
        description: gamification.level?.description || 'Começando a jornada',
        pointsRequired: gamification.level?.pointsRequired || 0,
        pointsToNext: gamification.level?.pointsToNext || 100,
        benefits: gamification.level?.benefits || []
      },
      badges: (gamification.badges || []).map((badge: any) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon || getBadgeIcon(badge.id),
        rarity: badge.rarity || 'common',
        earnedAt: badge.earnedAt,
        isNew: false
      })),
      achievements: gamification.achievements || [],
      quests: generateDailyQuests(),
      streak: gamification.streak || 0,
      completionRate: gamification.completionRate || 0,
      financialHealthScore: calculateFinancialHealthScore(gamification),
      motivationalInsights: generateMotivationalInsights(gamification),
      streaks: {
        login: {
          current: 1,
          longest: Math.max(1, gamification.streak || 0),
          lastActivityDate: new Date().toISOString(),
          type: 'daily_login'
        },
        payments: {
          current: gamification.streak || 0,
          longest: gamification.streak || 0,
          lastActivityDate: new Date().toISOString(),
          type: 'payment_on_time'
        },
        budget: {
          current: 0,
          longest: 0,
          lastActivityDate: new Date().toISOString(),
          type: 'budget_respected'
        }
      },
      stats: {
        totalXp: gamification.points || 0,
        totalBadges: gamification.badges?.length || 0,
        totalAchievements: gamification.achievements?.length || 0,
        totalQuestsCompleted: 0,
        joinedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      }
    };

    return NextResponse.json({
      gamification: enhancedGamification,
      profileInsights: generateProfileInsights(gamification)
    });

  } catch (error) {
    console.error('Erro ao buscar dados de gamificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Helper functions
function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Novato Financeiro',
    2: 'Aprendiz Econômico',
    3: 'Guardião do Bolso',
    4: 'Estrategista Financeiro',
    5: 'Mestre das Finanças',
    6: 'Sábio Econômico',
    7: 'Guru Financeiro',
    8: 'Lenda das Finanças',
    9: 'Titã Econômico',
    10: 'Deus das Finanças'
  };
  return titles[level] || `Nível ${level}`;
}

function getLevelIcon(level: number): string {
  const icons: Record<number, string> = {
    1: '🌱',
    2: '🌿',
    3: '🛡️',
    4: '⚔️',
    5: '👑',
    6: '📚',
    7: '🔮',
    8: '⚡',
    9: '🌟',
    10: '💎'
  };
  return icons[level] || '⭐';
}

function getBadgeIcon(badgeId: string): string {
  const icons: Record<string, string> = {
    'first_transaction': '💳',
    'first_installment': '📋',
    'on_time_streak': '⏰',
    'budget_master': '📊',
    'goal_achiever': '🎯',
    'savings_hero': '💰',
    'categorization_pro': '🏷️',
    'consistency_king': '👑',
    'early_bird': '🌅',
    'night_owl': '🦉'
  };
  return icons[badgeId] || '🏅';
}
