// src/app/api/installments/gamification/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { MongoInstallmentsRepository } from '@/core/adapters/mongodb/mongodb-installments.adapter';
import { IInstallmentsRepository } from '@/core/ports/installments.port';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID é obrigatório' }, { status: 400 });
    }

    // Verifica autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      if (decodedToken.uid !== userId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
    } catch (authError) {
      // Em desenvolvimento, pula a verificação do token
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }
    }

    const installmentsRepository = container.get<InstallmentsRepositoryPort>('InstallmentsRepository');
    const summary = await installmentsRepository.getSummary(userId);

    if (!summary) {
      return NextResponse.json({
        gamification: {
          points: 0,
          level: {
            level: 1,
            name: 'Iniciante',
            description: 'Começando a jornada financeira',
            pointsRequired: 0,
            pointsToNext: 100,
            benefits: ['Acesso ao sistema de parcelamentos']
          },
          badges: [],
          achievements: [],
          streak: 0,
          completionRate: 0,
          financialHealthScore: 0,
          motivationalInsights: []
        },
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

    // Calcula score de saúde financeira
    const calculateFinancialHealthScore = (gamification: any): number => {
      const weights = {
        level: 0.3,
        completionRate: 0.3,
        streak: 0.2,
        badges: 0.2
      };

      const normalizedLevel = Math.min((gamification.level.level / 10) * 100, 100);
      const normalizedCompletion = gamification.completionRate;
      const normalizedStreak = Math.min((gamification.streak / 12) * 100, 100);
      const normalizedBadges = Math.min((gamification.badges.length / 20) * 100, 100);

      const score =
        normalizedLevel * weights.level +
        normalizedCompletion * weights.completionRate +
        normalizedStreak * weights.streak +
        normalizedBadges * weights.badges;

      return Math.round(score);
    };

    // Gera insights motivacionais
    const generateMotivationalInsights = (gamification: any): string[] => {
      const insights: string[] = [];

      if (gamification.streak >= 6) {
        insights.push(`🔥 Sequência impressionante de ${gamification.streak} meses!`);
      }

      if (gamification.completionRate >= 90) {
        insights.push('🎯 Taxa de conclusão excelente - você é disciplinado!');
      }

      if (gamification.badges.length >= 5) {
        insights.push(`🏆 ${gamification.badges.length} badges conquistadas - parabéns!`);
      }

      if (gamification.level.level >= 5) {
        insights.push(`⭐ Nível ${gamification.level.level} - você é experiente!`);
      }

      if (insights.length === 0) {
        insights.push('💪 Continue assim, cada pagamento em dia conta!');
      }

      return insights;
    };

    // Gera insights do perfil
    const generateProfileInsights = (gamification: any) => {
      const healthScore = calculateFinancialHealthScore(gamification);

      let disciplineLevel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert';
      if (gamification.level.level >= 8) disciplineLevel = 'Expert';
      else if (gamification.level.level >= 5) disciplineLevel = 'Avançado';
      else if (gamification.level.level >= 3) disciplineLevel = 'Intermediário';
      else disciplineLevel = 'Iniciante';

      let paymentConsistency: 'Irregular' | 'Regular' | 'Muito Regular' | 'Exemplar';
      if (gamification.streak >= 12) paymentConsistency = 'Exemplar';
      else if (gamification.streak >= 6) paymentConsistency = 'Muito Regular';
      else if (gamification.streak >= 3) paymentConsistency = 'Regular';
      else paymentConsistency = 'Irregular';

      const strengths: string[] = [];
      if (gamification.completionRate >= 90) strengths.push('Excelente taxa de conclusão de parcelamentos');
      if (gamification.streak >= 6) strengths.push('Consistência exemplar nos pagamentos');
      if (gamification.badges.length >= 10) strengths.push('Múltiplas conquistas desbloqueadas');
      if (gamification.level.level >= 5) strengths.push('Alto nível de experiência financeira');

      const improvements: string[] = [];
      if (gamification.completionRate < 80) improvements.push('Foque em concluir todos os parcelamentos iniciados');
      if (gamification.streak < 3) improvements.push('Trabalhe na consistência dos pagamentos em dia');
      if (gamification.badges.length < 5) improvements.push('Explore mais funcionalidades para desbloquear badges');
      if (gamification.level.level < 3) improvements.push('Continue usando o sistema para subir de nível');

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
    };

    const enhancedGamification = {
      ...summary.gamification,
      financialHealthScore: calculateFinancialHealthScore(summary.gamification),
      motivationalInsights: generateMotivationalInsights(summary.gamification)
    };

    return NextResponse.json({
      gamification: enhancedGamification,
      profileInsights: generateProfileInsights(summary.gamification)
    });

  } catch (error) {
    console.error('Erro ao buscar dados de gamificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
