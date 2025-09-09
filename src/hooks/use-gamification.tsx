// src/hooks/use-gamification.tsx

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { InstallmentBadge, InstallmentLevel, InstallmentAchievement } from '@/core/ports/installments.port';

interface GamificationData {
  points: number;
  level: InstallmentLevel;
  badges: InstallmentBadge[];
  achievements: InstallmentAchievement[];
  streak: number;
  completionRate: number;
  financialHealthScore: number; // Novo score baseado na gamificação
  motivationalInsights: string[]; // Insights motivacionais
}

interface GamificationProfileInsights {
  disciplineLevel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert';
  paymentConsistency: 'Irregular' | 'Regular' | 'Muito Regular' | 'Exemplar';
  financialMaturity: number; // 0-100
  strengths: string[];
  improvements: string[];
  motivationalTip: string;
}

export function useGamification() {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [profileInsights, setProfileInsights] = useState<GamificationProfileInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();

  const fetchGamificationData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/installments/gamification?userId=${user.uid}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados de gamificação');
      }
      
      const data = await response.json();
      setGamificationData(data.gamification);
      setProfileInsights(data.profileInsights);
    } catch (error) {
      console.error('Erro ao buscar dados de gamificação:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Calcula score de saúde financeira baseado na gamificação
  const calculateFinancialHealthScore = useCallback((data: GamificationData): number => {
    if (!data) return 0;
    
    // Peso dos componentes
    const weights = {
      level: 0.3,        // 30% - Nível alcançado
      completionRate: 0.3, // 30% - Taxa de conclusão
      streak: 0.2,       // 20% - Consistência (streak)
      badges: 0.2        // 20% - Conquistas (badges)
    };
    
    // Normaliza cada componente (0-100)
    const normalizedLevel = Math.min((data.level.level / 10) * 100, 100);
    const normalizedCompletion = data.completionRate;
    const normalizedStreak = Math.min((data.streak / 12) * 100, 100); // 12 meses = 100%
    const normalizedBadges = Math.min((data.badges.length / 20) * 100, 100); // 20 badges = 100%
    
    const score = 
      normalizedLevel * weights.level +
      normalizedCompletion * weights.completionRate +
      normalizedStreak * weights.streak +
      normalizedBadges * weights.badges;
    
    return Math.round(score);
  }, []);

  // Gera insights do perfil baseado nos dados de gamificação
  const generateProfileInsights = useCallback((data: GamificationData): GamificationProfileInsights => {
    if (!data) {
      return {
        disciplineLevel: 'Iniciante',
        paymentConsistency: 'Irregular',
        financialMaturity: 0,
        strengths: [],
        improvements: ['Comece criando parcelamentos para desenvolver disciplina financeira'],
        motivationalTip: 'Dê o primeiro passo criando seu primeiro parcelamento!'
      };
    }

    const healthScore = calculateFinancialHealthScore(data);
    
    // Determina nível de disciplina
    let disciplineLevel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert';
    if (data.level.level >= 8) disciplineLevel = 'Expert';
    else if (data.level.level >= 5) disciplineLevel = 'Avançado';
    else if (data.level.level >= 3) disciplineLevel = 'Intermediário';
    else disciplineLevel = 'Iniciante';

    // Determina consistência de pagamento
    let paymentConsistency: 'Irregular' | 'Regular' | 'Muito Regular' | 'Exemplar';
    if (data.streak >= 12) paymentConsistency = 'Exemplar';
    else if (data.streak >= 6) paymentConsistency = 'Muito Regular';
    else if (data.streak >= 3) paymentConsistency = 'Regular';
    else paymentConsistency = 'Irregular';

    // Gera pontos fortes
    const strengths: string[] = [];
    if (data.completionRate >= 90) strengths.push('Excelente taxa de conclusão de parcelamentos');
    if (data.streak >= 6) strengths.push('Consistência exemplar nos pagamentos');
    if (data.badges.length >= 10) strengths.push('Múltiplas conquistas desbloqueadas');
    if (data.level.level >= 5) strengths.push('Alto nível de experiência financeira');

    // Gera áreas de melhoria
    const improvements: string[] = [];
    if (data.completionRate < 80) improvements.push('Foque em concluir todos os parcelamentos iniciados');
    if (data.streak < 3) improvements.push('Trabalhe na consistência dos pagamentos em dia');
    if (data.badges.length < 5) improvements.push('Explore mais funcionalidades para desbloquear badges');
    if (data.level.level < 3) improvements.push('Continue usando o sistema para subir de nível');

    // Dica motivacional baseada no perfil
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
  }, [calculateFinancialHealthScore]);

  useEffect(() => {
    fetchGamificationData();
  }, [user?.uid]); // Depend directly on user?.uid instead of fetchGamificationData

  useEffect(() => {
    if (gamificationData) {
      const insights = generateProfileInsights(gamificationData);
      setProfileInsights(insights);
    }
  }, [gamificationData]); // Remove generateProfileInsights to prevent loop

  return {
    gamificationData,
    profileInsights,
    isLoading,
    refresh: fetchGamificationData
  };
}
