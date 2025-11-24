// src/components/profile/financial-profile-card.tsx
"use client";

import {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  Typography,
  Chip,
  LinearProgress,
  Box,
  Stack,
  Skeleton,
  useTheme,
  alpha,
  keyframes,
} from "@mui/material";
import { RefreshCw, Sparkles, Trophy, Award, Zap } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useReports } from "@/hooks/use-reports";
import { useGamification } from "@/hooks/use-gamification";
import { getSmartFinancialProfile } from "@/services/ai-automation-service";
import { useAuth } from "@/hooks/use-auth";
import { startOfMonth, getYear } from "date-fns";
import { FinancialProfileOutput } from "@/ai/ai-types";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export function FinancialProfileCard() {
  const [profile, setProfile] = useState<FinancialProfileOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { allTransactions } = useTransactions();
  const { monthlyReports, annualReports } = useReports();
  const { gamificationData, profileInsights } = useGamification();
  const { user } = useAuth();
  const theme = useTheme();

  const currentMonthTransactions = useMemo(() => {
    const startOfCurrentMonth = startOfMonth(new Date());
    return allTransactions.filter(
      (t) => new Date(t.date) >= startOfCurrentMonth
    );
  }, [allTransactions]);

  const fetchProfile = useCallback(
    async (forceRefresh = false) => {
      if (!user) return;
      if (allTransactions.length === 0 && !forceRefresh) {
        setProfile({
          profileName: "Aguardando Dados",
          profileDescription:
            "Adicione transações para gerar seu primeiro perfil financeiro.",
        });
        return;
      }

      startTransition(async () => {
        setProfile(null);
        try {
          const currentYear = getYear(new Date());
          const currentYearMonthlyReports = monthlyReports.filter((r) =>
            r.period.startsWith(currentYear.toString())
          );
          const pastAnnualReports = annualReports.filter(
            (r) => parseInt(r.period) < currentYear
          );

          const newProfile = await getSmartFinancialProfile(
            {
              monthlyReports: JSON.stringify(
                currentYearMonthlyReports,
                null,
                2
              ),
              annualReports: JSON.stringify(pastAnnualReports, null, 2),
              currentMonthTransactions: JSON.stringify(
                currentMonthTransactions,
                null,
                2
              ),
              gamificationData: gamificationData
                ? JSON.stringify(gamificationData, null, 2)
                : undefined,
            },
            user.uid,
            forceRefresh
          );

          setProfile(newProfile);
        } catch (error: any) {
          console.error("Error fetching or setting financial profile:", error);
          setProfile({
            profileName: "Erro",
            profileDescription:
              error.message ||
              "Não foi possível carregar o perfil. Tente novamente.",
          });
        }
      });
    },
    [
      allTransactions,
      monthlyReports,
      annualReports,
      currentMonthTransactions,
      user,
      gamificationData,
    ]
  );

  useEffect(() => {
    if (user && allTransactions.length > 0) {
      fetchProfile();
    } else if (allTransactions.length === 0) {
      setProfile({
        profileName: "Aguardando Dados",
        profileDescription:
          "Adicione transações para gerar seu primeiro perfil.",
      });
    }
  }, [allTransactions.length, user]);

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: alpha(theme.palette.custom.card, 0.5),
        backdropFilter: "blur(4px)",
        borderColor: alpha(theme.palette.primary.main, 0.2),
      }}
    >
      <CardHeader>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Sparkles
                style={{
                  width: 20,
                  height: 20,
                  color: theme.palette.primary.main,
                }}
              />
              <Typography
                variant="h6"
                sx={{ color: alpha(theme.palette.primary.main, 0.9) }}
              >
                Seu Perfil Financeiro
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.primary.main, 0.7),
                mt: 1,
                display: "block",
              }}
            >
              Gerado 1x por mês. Atualizar custa 5 créditos.
            </Typography>
          </Box>
          <Button
            variant="text"
            size="small"
            onClick={() => fetchProfile(true)}
            disabled={isPending}
            sx={{
              minWidth: 32,
              width: 32,
              height: 32,
              p: 0,
              color: alpha(theme.palette.primary.main, 0.7),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              },
              borderRadius: "50%",
            }}
          >
            <RefreshCw
              style={{
                width: 16,
                height: 16,
                animation: isPending ? `${spin} 1s linear infinite` : "none",
              }}
            />
          </Button>
        </Stack>
      </CardHeader>
      <CardContent>
        <Divider sx={{ mb: 4 }} />
        {isPending || !profile ? (
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Skeleton
              variant="rounded"
              sx={{
                height: 20,
                width: "60%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
            <Skeleton
              variant="rounded"
              sx={{
                height: 16,
                width: "100%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
            <Skeleton
              variant="rounded"
              sx={{
                height: 16,
                width: "100%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
            <Skeleton
              variant="rounded"
              sx={{
                height: 16,
                width: "80%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            />
          </Stack>
        ) : (
          <Stack spacing={4} sx={{ pt: 2 }}>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "text.primary" }}
              >
                {profile.profileName}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 2, whiteSpace: "pre-line" }}
              >
                {profile.profileDescription}
              </Typography>
            </Box>

            {/* Seção de Gamificação */}
            {profile.gamificationInfluence && profileInsights && (
              <Stack spacing={3}>
                <Divider sx={{ my: 3 }} />
                <Stack spacing={3}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Trophy
                      style={{
                        width: 16,
                        height: 16,
                        color: theme.palette.primary.main,
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      color="primary"
                    >
                      Perfil Gamificado
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 3,
                    }}
                  >
                    <Box
                      sx={{ p: 3, bgcolor: "action.hover", borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Disciplina
                      </Typography>
                      <Chip
                        variant="outlined"
                        sx={{ mt: 1 }}
                        label={profile.gamificationInfluence.disciplineLevel}
                      />
                    </Box>
                    <Box
                      sx={{ p: 3, bgcolor: "action.hover", borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Consistência
                      </Typography>
                      <Chip
                        variant="outlined"
                        sx={{ mt: 1 }}
                        label={profile.gamificationInfluence.paymentConsistency}
                      />
                    </Box>
                  </Box>

                  {profileInsights.financialMaturity > 0 && (
                    <Box
                      sx={{
                        p: 3,
                        background: `linear-gradient(to right, ${alpha(
                          theme.palette.primary.main,
                          0.05
                        )}, ${alpha(theme.palette.primary.main, 0.1)})`,
                        borderRadius: 2,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Maturidade Financeira
                        </Typography>
                        <Typography variant="caption" fontWeight={500}>
                          {profileInsights.financialMaturity}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={profileInsights.financialMaturity}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  )}

                  {profile.gamificationInfluence.strengthsFromGamification &&
                    profile.gamificationInfluence.strengthsFromGamification
                      .length > 0 && (
                      <Stack spacing={2}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <Award
                            style={{
                              width: 12,
                              height: 12,
                              color: theme.palette.success.dark,
                            }}
                          />
                          <Typography
                            variant="caption"
                            fontWeight={500}
                            sx={{ color: "success.dark" }}
                          >
                            Pontos Fortes
                          </Typography>
                        </Stack>
                        {profile.gamificationInfluence.strengthsFromGamification
                          .slice(0, 2)
                          .map((strength, index) => (
                            <Box
                              key={index}
                              sx={{
                                fontSize: "0.75rem",
                                color: "success.main",
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                p: 2,
                                borderRadius: 1,
                              }}
                            >
                              • {strength}
                            </Box>
                          ))}
                      </Stack>
                    )}

                  {profileInsights.motivationalTip && (
                    <Box
                      sx={{
                        p: 3,
                        background: `linear-gradient(to right, ${alpha(
                          theme.palette.info.light,
                          0.2
                        )}, ${alpha(theme.palette.primary.light, 0.2)})`,
                        borderLeft: 4,
                        borderColor: "info.main",
                        borderRadius: "0 8px 8px 0",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        spacing={2}
                      >
                        <Zap
                          style={{
                            width: 16,
                            height: 16,
                            color: theme.palette.info.main,
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "info.dark", lineHeight: 1.6 }}
                        >
                          {profileInsights.motivationalTip}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
