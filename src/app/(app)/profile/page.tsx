// src/app/(app)/profile/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { FinancialProfileCard } from "@/components/profile/financial-profile-card";
import { GamificationSummary } from "@/components/profile/gamification-summary";
import { GamificationGuide, DailyQuestsCard } from "@/components/gamification";
import { PayrollCard } from "@/components/profile/payroll-card";
import { UpdateNameForm } from "@/components/profile/update-name-form";
import { UpdatePasswordForm } from "@/components/profile/update-password-form";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";

export default function ProfilePage() {
  const { isPro } = usePlan();

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Perfil e Configurações da Conta
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie suas informações pessoais, segurança e veja a análise do
            seu perfil financeiro.
          </Typography>
        </Box>
        <GamificationGuide />
      </Stack>

      <Grid container spacing={3}>
        {/* Primeira linha - Cards de configuração da conta */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title={<Typography variant="h6">Informações da Conta</Typography>}
              subheader={
                <Typography variant="body2" color="text.secondary">
                  Atualize seu nome de exibição.
                </Typography>
              }
            />
            <CardContent>
              <UpdateNameForm />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title={<Typography variant="h6">Segurança</Typography>}
              subheader={
                <Typography variant="body2" color="text.secondary">
                  Altere sua senha.
                </Typography>
              }
            />
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>
        </Grid>

        {/* Segunda linha - Holerite e Perfil Financeiro */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <PayrollCard />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          {isPro ? (
            <FinancialProfileCard />
          ) : (
            <ProUpgradeCard featureName="Análise de Perfil com IA" />
          )}
        </Grid>

        {/* Terceira linha - Gamificação (se Pro) */}
        {isPro && (
          <>
            <Grid size={{ xs: 12, lg: 8 }}>
              <GamificationSummary />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <DailyQuestsCard pageContext="profile" />
            </Grid>
          </>
        )}

        {/* Gamificação como upgrade para não-Pro */}
        {!isPro && (
          <Grid size={{ xs: 12 }}>
            <ProUpgradeCard featureName="Progresso Gamificado" />
          </Grid>
        )}
      </Grid>
    </Stack>
  );
}
