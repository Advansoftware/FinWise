// src/hooks/use-gamification.tsx

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { GamificationData, InstallmentBadge, InstallmentLevel, InstallmentAchievement } from '@/core/ports/installments.port';

interface GamificationProfileInsights {
  disciplineLevel: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert';
  paymentConsistency: 'Irregular' | 'Regular' | 'Muito Regular' | 'Exemplar';
  financialMaturity: number; // 0-100
  strengths: string[];
  improvements: string[];
  motivationalTip: string;
}

interface GamificationContextType {
    gamificationData: GamificationData | null;
    profileInsights: GamificationProfileInsights | null;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [profileInsights, setProfileInsights] = useState<GamificationProfileInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, loading: authLoading } = useAuth();

  const fetchGamificationData = useCallback(async () => {
    if (!user?.uid) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/installments/gamification?userId=${user.uid}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados de gamificação');
      }
      
      const data = await response.json();
      setGamificationData(data.gamification);
      setProfileInsights(data.profileInsights);
    } catch (error) {
      console.error('Erro ao buscar dados de gamificação:', error);
      setGamificationData(null);
      setProfileInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
        fetchGamificationData();
    }
  }, [fetchGamificationData, authLoading]);

  const value: GamificationContextType = {
      gamificationData,
      profileInsights,
      isLoading,
      refresh: fetchGamificationData
  }

  return (
    <GamificationContext.Provider value={value}>
        {children}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
