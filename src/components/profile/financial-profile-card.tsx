// src/components/profile/financial-profile-card.tsx
"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, Button, Divider, Typography, Chip, LinearProgress, Box, Stack } from '@mui/material';
import { RefreshCw, Sparkles, Trophy, Award, Target, Zap } from "lucide-react";
import { Skeleton } from "@/components/mui-wrappers/skeleton";
import { useTransactions } from "@/hooks/use-transactions";
import { useReports } from "@/hooks/use-reports";
import { useGamification } from "@/hooks/use-gamification";
import { getSmartFinancialProfile } from "@/services/ai-automation-service";
import { useAuth } from "@/hooks/use-auth";
import { startOfMonth, getYear } from "date-fns";
import { FinancialProfileOutput } from "@/ai/ai-types";

export function FinancialProfileCard() {
  const [profile, setProfile] = useState<FinancialProfileOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { allTransactions } = useTransactions();
  const { monthlyReports, annualReports } = useReports();
  const { gamificationData, profileInsights } = useGamification();
  const { user } = useAuth();

  const currentMonthTransactions = useMemo(() => {
    const startOfCurrentMonth = startOfMonth(new Date());
    return allTransactions.filter(t => new Date(t.date) >= startOfCurrentMonth);
  }, [allTransactions]);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    if (allTransactions.length === 0 && !forceRefresh) {
      setProfile({ profileName: "Aguardando Dados", profileDescription: "Adicione transações para gerar seu primeiro perfil financeiro."});
      return;
    }

    startTransition(async () => {
      setProfile(null); // Clear previous profile
      try {
           const currentYear = getYear(new Date());
           const currentYearMonthlyReports = monthlyReports.filter(r => r.period.startsWith(currentYear.toString()));
           const pastAnnualReports = annualReports.filter(r => parseInt(r.period) < currentYear);

          const newProfile = await getSmartFinancialProfile({
            monthlyReports: JSON.stringify(currentYearMonthlyReports, null, 2),
            annualReports: JSON.stringify(pastAnnualReports, null, 2),
            currentMonthTransactions: JSON.stringify(currentMonthTransactions, null, 2),
            gamificationData: gamificationData ? JSON.stringify(gamificationData, null, 2) : undefined
          }, user.uid, forceRefresh);

          setProfile(newProfile);
        
      } catch (error: any) {
        console.error("Error fetching or setting financial profile:", error);
        setProfile({ profileName: "Erro", profileDescription: error.message || "Não foi possível carregar o perfil. Tente novamente."});
      }
    });
  }, [allTransactions, monthlyReports, annualReports, currentMonthTransactions, user, gamificationData]);

  useEffect(() => {
    if(user && allTransactions.length > 0) {
        fetchProfile();
    } else if (allTransactions.length === 0) {
        setProfile({ profileName: "Aguardando Dados", profileDescription: "Adicione transações para gerar seu primeiro perfil."});
    }
  }, [allTransactions.length, user]);

  return (
    <Card sx={{ height: '100%', bgcolor: theme => `${theme.palette.custom.card}80`, backdropFilter: 'blur(4px)', borderColor: theme => `${theme.palette.primary.main}33` }}>
      <CardHeader>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
             <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                    <Typography variant="h6" sx={{ color: theme => `${theme.palette.primary.main}e6` }}>Seu Perfil Financeiro</Typography>
                </Stack>
                 <Typography variant="caption" sx={{ color: theme => `${theme.palette.primary.main}b3`, mt: 1, display: 'block' }}>
                    Gerado 1x por mês. Atualizar custa 5 créditos.
                </Typography>
            </Box>
            <Button
                variant="text"
                size="small"
                sx={{
                  minWidth: '2rem', 
                  width: '2rem', 
                  height: '2rem', 
                  p: 0,
                  color: theme => `${theme.palette.primary.main}b3`,
                  '&:hover': {
                    bgcolor: theme => `${theme.palette.primary.main}1a`,
                    color: 'primary.main'
                  },
                  borderRadius: '9999px',
                }}
            >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} className={isPending ? "animate-spin" : ""} />
            </Button>
        </Stack>
      </CardHeader>
      <CardContent>
        <Divider sx={{ mb: 4 }} />
        {isPending || !profile ? (
           <Stack spacing={3} sx={{ pt: 2 }}>
            <Skeleton sx={{ height: '1.25rem', width: '60%', bgcolor: theme => `${theme.palette.primary.main}1a` }} />
            <Skeleton sx={{ height: '1rem', width: '100%', bgcolor: theme => `${theme.palette.primary.main}1a` }} />
            <Skeleton sx={{ height: '1rem', width: '100%', bgcolor: theme => `${theme.palette.primary.main}1a` }} />
            <Skeleton sx={{ height: '1rem', width: '80%', bgcolor: theme => `${theme.palette.primary.main}1a` }} />
          </Stack>
        ) : (
          <Stack spacing={4} sx={{ pt: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{profile.profileName}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, whiteSpace: 'pre-line' }}>
                {profile.profileDescription}
              </Typography>
            </Box>

            {/* Seção de Gamificação */}
            {profile.gamificationInfluence && profileInsights && (
              <div className="space-y-3">
                <Divider className="my-3" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Trophy className="h-4 w-4" />
                    Perfil Gamificado
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground">Disciplina</div>
                      <Chip variant="outlined" className="mt-1" label={profile.gamificationInfluence.disciplineLevel} />
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground">Consistência</div>
                      <Chip variant="outlined" className="mt-1" label={profile.gamificationInfluence.paymentConsistency} />
                    </div>
                  </div>

                  {profileInsights.financialMaturity > 0 && (
                    <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Maturidade Financeira</span>
                        <span className="font-medium">{profileInsights.financialMaturity}%</span>
                      </div>
                      <LinearProgress variant="determinate" value={profileInsights.financialMaturity} className="h-2" />
                    </div>
                  )}

                  {profile.gamificationInfluence.strengthsFromGamification && 
                   profile.gamificationInfluence.strengthsFromGamification.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                        <Award className="h-3 w-3" />
                        Pontos Fortes
                      </div>
                      {profile.gamificationInfluence.strengthsFromGamification.slice(0, 2).map((strength, index) => (
                        <div key={index} className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          • {strength}
                        </div>
                      ))}
                    </div>
                  )}

                  {profileInsights.motivationalTip && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-lg">
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                          {profileInsights.motivationalTip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
