"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Chip } from "@mui/material";
import { Card, CardContent, CardHeader, Grid } from "@mui/material";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Image,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useCreditTransparency } from "@/hooks/use-credit-transparency";
import { Button } from "@mui/material";
import { Divider } from "@mui/material";
import { Alert } from "@mui/material";
import { Box, Stack, Typography } from "@mui/material";

interface CreditStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditStatementDialog({
  open,
  onOpenChange,
}: CreditStatementDialogProps) {
  const router = useRouter();
  const {
    currentCredits,
    plan,
    getAlternativeMessage,
    actions,
    willConsumeCredits,
    isUsingGastometriaAI,
  } = useCreditTransparency();

  const alternativeSuggestion = getAlternativeMessage();

  const formatCreditCost = (cost: number) =>
    `${cost} crédito${cost !== 1 ? "s" : ""}`;
  const formatBalance = (balance: number) =>
    `${balance} crédito${balance !== 1 ? "s" : ""}`;

  // Estatísticas baseadas nas ações reais disponíveis
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
  const averagePerAction =
    totalActionsUsed > 0 ? totalSpent / totalActionsUsed : 0;

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
        return "Processamento de Imagens";
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

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      fullWidth
      scroll="body"
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <BarChart3 style={{ width: "1.25rem", height: "1.25rem" }} />
        Extrato de Créditos IA
      </DialogTitle>
      <DialogContent>
        <Stack spacing={{ xs: 3, md: 4 }}>
          {/* Resumo Geral */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardHeader sx={{ pb: 2 }}>
                  <Box
                    component="h3"
                    sx={{ fontSize: "0.875rem", fontWeight: 500, m: 0 }}
                  >
                    Saldo Atual
                  </Box>
                </CardHeader>
                <CardContent>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#2563eb" }}
                  >
                    {formatBalance(currentCredits)}
                  </Typography>
                  <Chip
                    variant="filled"
                    color={currentCredits > 10 ? "secondary" : "error"}
                    label={plan}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardHeader sx={{ pb: 2 }}>
                  <Box
                    component="h3"
                    sx={{ fontSize: "0.875rem", fontWeight: 500, m: 0 }}
                  >
                    Total Gasto
                  </Box>
                </CardHeader>
                <CardContent>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#64748b" }}
                  >
                    {formatCreditCost(totalSpent)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", mt: 1, display: "block" }}
                  >
                    Este mês
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardHeader sx={{ pb: 2 }}>
                  <Box
                    component="h3"
                    sx={{ fontSize: "0.875rem", fontWeight: 500, m: 0 }}
                  >
                    Média por Ação
                  </Box>
                </CardHeader>
                <CardContent>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#64748b" }}
                  >
                    {formatCreditCost(Math.round(averagePerAction))}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", mt: 1, display: "block" }}
                  >
                    {totalActionsUsed} ações realizadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Aviso sobre Transparência */}
          <Alert
            icon={<AlertTriangle style={{ width: "1rem", height: "1rem" }} />}
          >
            <Typography variant="body2">
              <strong>Transparência Total:</strong> Mostramos exatamente quantos
              créditos cada ação consome. Conversas simples custam 1 crédito,
              análises complexas custam 5 créditos.
            </Typography>
          </Alert>

          {/* Detalhamento por Categoria */}
          <Stack spacing={4}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Uso por Categoria
            </Typography>

            {Object.entries(categoryStats).map(([category, data]) => {
              const usage =
                mockUsageStats[category as keyof typeof mockUsageStats];
              const typedCategory = category as "simple" | "complex" | "image";

              return (
                <Card key={category} sx={{ borderLeft: "4px solid #3b82f6" }}>
                  <CardHeader sx={{ pb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{ fontSize: "1rem", fontWeight: 600, m: 0 }}
                      >
                        {getCategoryIcon(typedCategory)}
                        {getCategoryLabel(typedCategory)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {getCategoryDescription(typedCategory)}
                    </Typography>
                  </CardHeader>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 500 }}>
                            {usage.used}
                          </Box>{" "}
                          ações realizadas
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          Consumiu {formatCreditCost(usage.spent)}
                        </Typography>
                      </Stack>
                      <Box sx={{ textAlign: "right" }}>
                        <Chip
                          variant="outlined"
                          label={`${
                            usage.used > 0
                              ? Math.round(usage.spent / usage.used)
                              : 0
                          } créditos/ação`}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {/* Alternativas Gratuitas */}
          {alternativeSuggestion && (
            <Stack spacing={3}>
              <Divider />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Settings style={{ width: "1.25rem", height: "1.25rem" }} />
                Opções Gratuitas Disponíveis
              </Typography>

              <Alert icon={<Bot style={{ width: "1rem", height: "1rem" }} />}>
                <Typography variant="body2">
                  <strong>Economia de Créditos:</strong> {alternativeSuggestion}
                </Typography>
              </Alert>
            </Stack>
          )}

          {/* Ações */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ pt: 2 }}
          >
            <Button
              variant="outlined"
              onClick={() => onOpenChange(false)}
              sx={{ flex: 1 }}
            >
              Fechar
            </Button>
            <Button
              variant="contained"
              sx={{ flex: 1 }}
              onClick={() => {
                onOpenChange(false);
                router.push("/settings");
              }}
              startIcon={<Settings style={{ width: "1rem", height: "1rem" }} />}
            >
              Configurar IA
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
