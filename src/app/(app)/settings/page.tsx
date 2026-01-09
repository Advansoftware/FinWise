// src/app/(app)/settings/page.tsx
"use client";

import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Button,
  alpha,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Sparkles,
  Users,
  CreditCard,
  Shield,
  Bell,
  Palette,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import { useCredits } from "@/hooks/use-credits";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";
import Link from "next/link";

export default function SettingsPage() {
  const { plan, isLoading: isPlanLoading, isInfinity } = usePlan();
  const { credits, isLoading: isLoadingCredits } = useCredits();

  // Block page for Basic plan users
  if (!isPlanLoading && plan === "Básico") {
    return <ProUpgradeCard featureName="Configurações" />;
  }

  const settingsItems = [
    {
      icon: Users,
      label: "Modo Família",
      description: "Compartilhe suas finanças com pessoas de confiança",
      href: "/family",
      badge: isInfinity ? null : "Infinity",
      disabled: !isInfinity,
    },
    {
      icon: CreditCard,
      label: "Assinatura e Pagamentos",
      description: "Gerencie seu plano e métodos de pagamento",
      href: "/settings/payments",
      disabled: false,
    },
    {
      icon: Shield,
      label: "Privacidade e Segurança",
      description: "Configurações de conta e autenticação",
      href: "/profile",
      disabled: false,
    },
    {
      icon: Bell,
      label: "Notificações",
      description: "Configure alertas e lembretes",
      href: "/profile#notifications",
      disabled: false,
    },
    {
      icon: Palette,
      label: "Aparência",
      description: "Tema, cores e preferências visuais",
      href: "/profile#appearance",
      disabled: false,
    },
  ];

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight="bold">
          Configurações
        </Typography>
        <Typography color="text.secondary">
          Gerencie suas preferências e configurações da conta
        </Typography>
      </Box>

      {/* IA Card - Informativo */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Gastometria IA
                </Typography>
                <Chip
                  size="small"
                  label="Ativo"
                  color="success"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Nossa IA integrada categoriza suas transações, oferece dicas
                personalizadas e gera relatórios inteligentes automaticamente.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Créditos disponíveis
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    color="primary.main"
                  >
                    {isLoadingCredits ? "..." : credits}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  component={Link}
                  href="/profile"
                  endIcon={<ExternalLink size={14} />}
                >
                  Ver extrato
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Settings List */}
      <Card>
        <List disablePadding>
          {settingsItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <ListItem
                key={item.href}
                disablePadding
                divider={index < settingsItems.length - 1}
              >
                <ListItemButton
                  component={item.disabled ? "div" : Link}
                  href={item.disabled ? undefined : item.href}
                  disabled={item.disabled}
                  sx={{
                    py: 2,
                    px: 3,
                    opacity: item.disabled ? 0.6 : 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 44 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComponent size={18} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {item.label}
                        {item.badge && (
                          <Chip
                            size="small"
                            label={item.badge}
                            color="primary"
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                        )}
                      </Box>
                    }
                    secondary={item.description}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <ChevronRight size={18} color="#9ca3af" />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Card>

      {/* API Access - Para devs no Infinity */}
      {isInfinity && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ fontSize: "1.5rem" }}>🔧</Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  API para Desenvolvedores
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Como assinante Infinity, você tem acesso à nossa API REST para
                  integrar o Gastometria com seus próprios projetos e
                  automações.
                </Typography>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/api-docs"
                  endIcon={<ExternalLink size={14} />}
                >
                  Ver Documentação da API
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
