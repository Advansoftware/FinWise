// src/hooks/use-gamification.tsx

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { InstallmentBadge, InstallmentLevel, InstallmentAchievement } from '@/core/ports/installments.port';

interface GamificationData {
  points: number;
  level: InstallmentLevel;
  badges: InstallmentBadge[];
  achievements: InstallmentAchievement[];
  streak: number;
  completionRate: number;
  financialHealthScore: number; 
  motivationalInsights: string[]; 
}

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
  
  const { user } = useAuth();

  const fetchGamificationData = useCallback(async () => {
    if (!user?.uid) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    try {
      // Usar uma API route para buscar os dados de gamificação
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
  }, [user?.uid]);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

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
