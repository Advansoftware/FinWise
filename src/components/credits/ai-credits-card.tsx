// src/components/credits/ai-credits-card.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  Tabs,
  Tab,
  Divider,
  Skeleton,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Sparkles,
  Zap,
  BarChart3,
  MessageCircle,
  Image,
  Bot,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCredits } from "@/hooks/use-credits";
import { usePlan } from "@/hooks/use-plan";
import { useAISettings } from "@/hooks/use-ai-settings";
import { useCreditTransparency } from "@/hooks/use-credit-transparency";

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
      id={`credits-tabpanel-${index}`}
      aria-labelledby={`credits-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export function AICreditsCard() {
  const router = useRouter();
  const { credits, isLoading: isLoadingCredits } = useCredits();
  const { plan, isPlus, isInfinity, isLoading: isLoadingPlan } = usePlan();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const { actions, getAlternativeMessage } = useCreditTransparency();
  const [tabValue, setTabValue] = useState(0);

  const isLoading = isLoadingCredits || isLoadingPlan;

  // Verificar qual IA está sendo usada
  const activeCredential = displayedCredentials.find(
    (c) => c.id === activeCredentialId
  );
  const isUsingGastometriaAI =
    activeCredential?.id === "gastometria-ai-default" ||
    activeCredential?.provider === "gastometria" ||
    !activeCredential;

  const alternativeSuggestion = getAlternativeMessage();

  // Estatísticas por categoria
  const getStatisticsByCategory = () => {
    const categories = {
      simple: {
        actions: [] as Array<{ key: string } & (typeof actions)[string]>,
        totalCost: 0,
      },
      complex: {
        actions: [] as Array<{ key: string } & (typeof actions)[string]>,
        totalCost: 0,
      },
      image: {
        actions: [] as Array<{ key: string } & (typeof actions)[string]>,
        totalCost: 0,
      },
    };

    Object.entries(actions).forEach(([key, action]) => {
      categories[action.category].actions.push({ key, ...action });
      categories[action.category].totalCost += action.cost;
    });

    return categories;
  };

  const categoryStats = getStatisticsByCategory();

  // Simulação de uso - em produção isso viria do backend
  const mockUsageStats = {
    simple: { used: 12, spent: 15 },
    complex: { used: 3, spent: 15 },
    image: { used: 1, spent: 10 },
  };

  const totalActionsUsed = Object.values(mockUsageStats).reduce(
    (sum, stat) => sum + stat.used,
    0
  );
  const totalSpent = Object.values(mockUsageStats).reduce(
    (sum, stat) => sum + stat.spent,
    0
  );

  const formatCreditCost = (cost: number) =>
    `${cost} crédito${cost !== 1 ? "s" : ""}`;

  const getCategoryIcon = (category: "simple" | "complex" | "image") => {
    const iconStyle = { width: "1rem", height: "1rem" };
    switch (category) {
      case "simple":
        return <MessageCircle style={iconStyle} />;
      case "complex":
        return <BarChart3 style={iconStyle} />;
      case "image":
        return <Image style={iconStyle} />;
      default:
        return <Bot style={iconStyle} />;
    }
  };

  const getCategoryLabel = (category: "simple" | "complex" | "image") => {
    switch (category) {
      case "simple":
        return "Ações Simples";
      case "complex":
        return "Análises Complexas";
      case "image":
        return "Imagens";
      default:
        return "Outros";
    }
  };

  const getCategoryDescription = (category: "simple" | "complex" | "image") => {
    switch (category) {
      case "simple":
        return "Conversas básicas e sugestões rápidas (1-2 créditos)";
      case "complex":
        return "Relatórios e análises detalhadas (5 créditos)";
      case "image":
        return "OCR e processamento de imagens (10 créditos)";
      default:
        return "Outras funcionalidades IA";
    }
  };

  // Plano básico não tem créditos
  if (plan === "Básico" && !isLoading) {
    return (
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Sparkles size={20} />
              <Typography variant="h6">Créditos de IA</Typography>
            </Stack>
          }
        />
        <CardContent>
          <Alert severity="info">
            Faça upgrade para o plano Plus ou Infinity para ter acesso aos
            créditos de IA e funcionalidades avançadas.
          </Alert>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => router.push("/billing")}
          >
            Ver planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Sparkles size={20} />
            <Typography variant="h6">Créditos de IA</Typography>
          </Stack>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            Gerencie seus créditos e veja o extrato de uso
          </Typography>
        }
        action={
          <Chip
            size="small"
            label={isUsingGastometriaAI ? "Gastometria IA" : "IA Própria"}
            icon={
              isUsingGastometriaAI ? <Sparkles size={12} /> : <Zap size={12} />
            }
            sx={{
              ...(isUsingGastometriaAI
                ? {
                    bgcolor: "rgba(59, 130, 246, 0.1)",
                    color: "#2563eb",
                    borderColor: "rgba(59, 130, 246, 0.2)",
                    "& .MuiChip-icon": { color: "#2563eb" },
                  }
                : {
                    bgcolor: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    borderColor: "rgba(16, 185, 129, 0.2)",
                    "& .MuiChip-icon": { color: "#059669" },
                  }),
            }}
            variant="outlined"
          />
        }
      />
      <CardContent>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Resumo" />
          <Tab label="Extrato" />
        </Tabs>

        {/* Tab Resumo */}
        <TabPanel value={tabValue} index={0}>
          {isLoading ? (
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={80} />
              <Skeleton variant="rectangular" height={60} />
            </Stack>
          ) : (
            <Stack spacing={3}>
              {/* Saldo atual */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: credits < 10 ? "error.50" : "primary.50",
                  border: 1,
                  borderColor: credits < 10 ? "error.200" : "primary.200",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Saldo Atual
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      sx={{
                        color: credits < 10 ? "error.main" : "primary.main",
                      }}
                    >
                      {credits}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      créditos disponíveis
                    </Typography>
                  </Box>
                  <Chip
                    label={plan}
                    color={
                      isInfinity ? "secondary" : isPlus ? "primary" : "default"
                    }
                    variant="filled"
                  />
                </Stack>
              </Box>

              {/* Uso este mês */}
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ mb: 1.5 }}
                >
                  Uso este mês
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h5" fontWeight="bold">
                        {totalSpent}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        créditos gastos
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h5" fontWeight="bold">
                        {totalActionsUsed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ações realizadas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Dica de economia */}
              {isUsingGastometriaAI && alternativeSuggestion && (
                <Alert
                  severity="info"
                  icon={<Bot size={16} />}
                  action={
                    <Button
                      size="small"
                      onClick={() => router.push("/settings")}
                    >
                      Configurar
                    </Button>
                  }
                >
                  <Typography variant="body2">
                    {alternativeSuggestion}
                  </Typography>
                </Alert>
              )}

              {!isUsingGastometriaAI && (
                <Alert severity="success" icon={<Zap size={16} />}>
                  <Typography variant="body2">
                    Você está usando suas próprias credenciais de IA. Uso
                    ilimitado e gratuito! 🎉
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </TabPanel>

        {/* Tab Extrato */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={2}>
            {/* Aviso de transparência */}
            <Alert
              severity="info"
              icon={<AlertTriangle size={16} />}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2">
                <strong>Transparência Total:</strong> Conversas simples custam
                1-2 créditos, análises complexas 5 créditos, imagens 10
                créditos.
              </Typography>
            </Alert>

            {/* Detalhamento por categoria */}
            {Object.entries(categoryStats).map(([category, data]) => {
              const usage =
                mockUsageStats[category as keyof typeof mockUsageStats];
              const typedCategory = category as "simple" | "complex" | "image";

              return (
                <Box
                  key={category}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                    borderLeft: 4,
                    borderLeftColor: "primary.main",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getCategoryIcon(typedCategory)}
                        <Typography variant="subtitle2" fontWeight={600}>
                          {getCategoryLabel(typedCategory)}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {getCategoryDescription(typedCategory)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={500}>
                        {usage.used} ações
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCreditCost(usage.spent)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}

            <Divider />

            {/* Botão configurar IA */}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Settings size={16} />}
              onClick={() => router.push("/settings")}
            >
              Configurar IA
            </Button>
          </Stack>
        </TabPanel>
      </CardContent>
    </Card>
  );
}
