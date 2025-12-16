// src/app/(app)/profile/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { User, Receipt, FileText } from "lucide-react";
import { FinancialProfileCard } from "@/components/profile/financial-profile-card";
import { GamificationSummary } from "@/components/profile/gamification-summary";
import { GamificationGuide, DailyQuestsCard } from "@/components/gamification";
import { PayrollCard } from "@/components/profile/payroll-card";
import { UpdateNameForm } from "@/components/profile/update-name-form";
import { UpdatePasswordForm } from "@/components/profile/update-password-form";
import { CPFCard } from "@/components/profile/cpf-card";
import { AICreditsCard } from "@/components/credits/ai-credits-card";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";
import { getFeatureFlags } from "@/lib/feature-flags";

const { openFinance: isOpenFinanceEnabled } = getFeatureFlags();

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { isPro } = usePlan();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
            Perfil e Configurações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie suas informações pessoais, créditos de IA e holerite.
          </Typography>
        </Box>
        <GamificationGuide />
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Abas do perfil"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<User size={18} />}
            iconPosition="start"
            label="Perfil"
            id="profile-tab-0"
            aria-controls="profile-tabpanel-0"
          />
          <Tab
            icon={<Receipt size={18} />}
            iconPosition="start"
            label="Créditos IA"
            id="profile-tab-1"
            aria-controls="profile-tabpanel-1"
          />
          <Tab
            icon={<FileText size={18} />}
            iconPosition="start"
            label="Holerite"
            id="profile-tab-2"
            aria-controls="profile-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* Tab: Perfil */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Informações da conta */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: "100%" }}>
              <CardHeader
                title={
                  <Typography variant="h6">Informações da Conta</Typography>
                }
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

          {/* Segurança */}
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

          {/* CPF para Open Finance */}
          {isOpenFinanceEnabled && (
            <Grid size={{ xs: 12, lg: 6 }}>
              <CPFCard />
            </Grid>
          )}

          {/* Perfil Financeiro */}
          <Grid size={{ xs: 12, lg: isOpenFinanceEnabled ? 6 : 12 }}>
            {isPro ? (
              <FinancialProfileCard />
            ) : (
              <ProUpgradeCard featureName="Análise de Perfil com IA" />
            )}
          </Grid>

          {/* Gamificação (se Pro) */}
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
      </TabPanel>

      {/* Tab: Créditos IA */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <AICreditsCard />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardHeader
                title={<Typography variant="h6">Dicas de Economia</Typography>}
              />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      💡 Use IA própria
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure suas credenciais de IA para uso ilimitado e
                      gratuito.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      🎯 Ações simples
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Conversas básicas consomem menos créditos que análises
                      complexas.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      📊 Monitore o uso
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Acompanhe seu extrato para entender onde você mais usa
                      créditos.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab: Holerite */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <PayrollCard />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardHeader
                title={<Typography variant="h6">Sobre o Holerite</Typography>}
              />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      📄 O que é?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      O holerite permite registrar sua renda mensal para melhor
                      análise financeira.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      🔒 Privacidade
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Seus dados são criptografados e nunca compartilhados com
                      terceiros.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      📈 Benefícios
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Melhores insights sobre sua capacidade de poupança e
                      orçamento.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Stack>
  );
}
