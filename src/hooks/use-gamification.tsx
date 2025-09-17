// src/hooks/use-gamification.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { useDataRefresh } from './use-data-refresh';
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
  const { registerRefreshHandler, unregisterRefreshHandler, triggerRefresh } = useDataRefresh();

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
  }, [user?.uid]);

  useEffect(() => {
    const refreshHandler = () => {
      if (user?.uid && !authLoading) {
        fetchGamificationData();
      }
    };

    registerRefreshHandler('gamification', refreshHandler);

    return () => {
      unregisterRefreshHandler('gamification');
    };
  }, [user?.uid, authLoading, registerRefreshHandler, unregisterRefreshHandler, fetchGamificationData]);

  useEffect(() => {
    if (!authLoading && user?.uid) {
        fetchGamificationData();
    }
  }, [user?.uid, authLoading, fetchGamificationData]);

  const value: GamificationContextType = {
      gamificationData,
      profileInsights,
      isLoading,
      refresh: async () => {
        await fetchGamificationData();
        triggerRefresh();
      }
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
