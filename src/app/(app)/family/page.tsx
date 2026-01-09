// src/app/(app)/family/page.tsx

/**
 * Página do Modo Família
 *
 * Gerenciamento completo de família, membros e compartilhamento.
 * Disponível apenas para usuários do plano Infinity.
 */

"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Tabs,
  Tab,
  alpha,
  useTheme,
  Skeleton,
} from "@mui/material";
import {
  Users,
  UserPlus,
  Settings,
  Lock,
  Crown,
  ArrowRight,
} from "lucide-react";
import { useFamily, useFamilyFeature } from "@/hooks/use-family";
import { usePlan } from "@/hooks/use-plan";
import {
  FamilyCard,
  CreateFamilyDialog,
  InviteMemberDialog,
  PendingInvitesCard,
  SharingSettings,
} from "@/components/family";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function FamilyPage() {
  const theme = useTheme();
  const { isInfinity, isLoading: planLoading } = usePlan();
  const { family, isLoading, isInFamily, isOwner, pendingInvites } =
    useFamily();
  const { isFamilyFeatureAvailable, memberCount, maxMembers } =
    useFamilyFeature();

  const [currentTab, setCurrentTab] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  if (planLoading || isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ mt: 2, borderRadius: 2 }}
        />
      </Container>
    );
  }

  // Se não é Infinity, mostra upsell
  if (!isInfinity) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              mx: "auto",
              mb: 3,
            }}
          >
            <Users size={40} />
          </Box>

          <Typography variant="h4" gutterBottom>
            Modo Família
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 500, mx: "auto" }}
          >
            Gerencie suas finanças junto com sua família! Compartilhe carteiras,
            acompanhe metas em conjunto e mantenha o controle financeiro
            familiar.
          </Typography>

          <Grid
            container
            spacing={3}
            sx={{ mb: 4, textAlign: "left", maxWidth: 600, mx: "auto" }}
          >
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }}
                >
                  <Users size={20} />
                </Box>
                <Typography variant="body2">Até 5 membros</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                  }}
                >
                  <Lock size={20} />
                </Box>
                <Typography variant="body2">Privacidade individual</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                  }}
                >
                  <Settings size={20} />
                </Box>
                <Typography variant="body2">
                  Compartilhamento seletivo
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                  }}
                >
                  <Crown size={20} />
                </Box>
                <Typography variant="body2">Exclusivo Infinity</Typography>
              </Box>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowRight size={20} />}
            href="/app/billing"
          >
            Assinar Infinity
          </Button>
        </Box>
      </Container>
    );
  }

  // Se não tem família, mostra opção de criar
  if (!isInFamily) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Mostrar convites pendentes */}
        {pendingInvites.length > 0 && <PendingInvitesCard />}

        <Box
          sx={{
            textAlign: "center",
            py: 6,
            px: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              mx: "auto",
              mb: 3,
            }}
          >
            👨‍👩‍👧‍👦
          </Box>

          <Typography variant="h5" gutterBottom>
            Crie sua Família
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 450, mx: "auto" }}
          >
            Como assinante Infinity, você pode criar uma família e convidar até
            4 pessoas para gerenciar finanças juntos.
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<Users size={20} />}
            onClick={() => setShowCreateDialog(true)}
          >
            Criar Família
          </Button>
        </Box>

        <CreateFamilyDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      </Container>
    );
  }

  // Tem família - mostra dashboard completo
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Modo Família
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie sua família e configure o compartilhamento
        </Typography>
      </Box>

      {/* Card da família */}
      <Box sx={{ mb: 4 }}>
        <FamilyCard
          onManage={() => setCurrentTab(1)}
          onInvite={() => setShowInviteDialog(true)}
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab
            icon={<Users size={18} />}
            iconPosition="start"
            label="Membros"
          />
          <Tab
            icon={<Lock size={18} />}
            iconPosition="start"
            label="Compartilhamento"
          />
          {isOwner && (
            <Tab
              icon={<Settings size={18} />}
              iconPosition="start"
              label="Configurações"
            />
          )}
        </Tabs>
      </Box>

      {/* Tab: Membros */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {family?.members
            .filter((m) => m.status === "active")
            .map((member) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={member.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontSize: "1.25rem",
                          fontWeight: 600,
                        }}
                      >
                        {member.displayName.charAt(0).toUpperCase()}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">
                          {member.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                      {member.role === "owner" && (
                        <Crown size={18} color={theme.palette.warning.main} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

          {/* Botão de adicionar */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: "100%",
                minHeight: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                bgcolor: "transparent",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                },
              }}
              onClick={() => setShowInviteDialog(true)}
            >
              <Box sx={{ textAlign: "center" }}>
                <UserPlus size={24} color={theme.palette.primary.main} />
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Convidar
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab: Compartilhamento */}
      <TabPanel value={currentTab} index={1}>
        <SharingSettings />
      </TabPanel>

      {/* Tab: Configurações (apenas owner) */}
      {isOwner && (
        <TabPanel value={currentTab} index={2}>
          <Alert severity="info">
            Configurações avançadas da família em desenvolvimento.
          </Alert>
        </TabPanel>
      )}

      {/* Dialogs */}
      <InviteMemberDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
    </Container>
  );
}
