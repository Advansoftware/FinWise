// src/app/(marketing)/calculadoras/calculadoras-content.tsx
"use client";

import Link from "next/link";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Plane,
  Gift,
  Calendar,
  TrendingUp,
  Calculator,
  Briefcase,
  PiggyBank,
  Receipt,
} from "lucide-react";

const calculadoras = [
  {
    id: "ferias",
    title: "Calculadora de Férias",
    description:
      "Calcule o valor líquido das suas férias, incluindo 1/3 constitucional e descontos de INSS e IR.",
    icon: Plane,
    color: "#2196f3",
    popular: true,
  },
  {
    id: "decimo-terceiro",
    title: "Calculadora de 13º Salário",
    description:
      "Simule o valor do seu décimo terceiro salário, 1ª e 2ª parcelas com todos os descontos.",
    icon: Gift,
    color: "#4caf50",
    popular: true,
  },
  {
    id: "rescisao",
    title: "Calculadora de Rescisão",
    description:
      "Calcule todos os valores da rescisão trabalhista: saldo de salário, férias, 13º proporcional e multa FGTS.",
    icon: Briefcase,
    color: "#ff9800",
    popular: true,
  },
  {
    id: "fgts",
    title: "Calculadora de FGTS",
    description:
      "Simule o saldo do seu FGTS e calcule a multa de 40% em caso de demissão sem justa causa.",
    icon: PiggyBank,
    color: "#9c27b0",
    popular: false,
  },
  {
    id: "inss",
    title: "Calculadora de INSS",
    description:
      "Calcule o desconto do INSS sobre seu salário com as alíquotas atualizadas de 2024.",
    icon: Receipt,
    color: "#00bcd4",
    popular: false,
  },
  {
    id: "imposto-renda",
    title: "Calculadora de Imposto de Renda",
    description:
      "Simule o desconto de IR na fonte com base na tabela progressiva atualizada.",
    icon: Calculator,
    color: "#f44336",
    popular: false,
  },
  {
    id: "projecao-salarial",
    title: "Projeção Salarial",
    description:
      "Projete seus ganhos futuros considerando reajustes, promoções e benefícios.",
    icon: TrendingUp,
    color: "#673ab7",
    popular: false,
  },
  {
    id: "pos-ferias",
    title: "Calculadora Pós-Férias",
    description:
      "Calcule o salário do mês após as férias, considerando os dias trabalhados.",
    icon: Calendar,
    color: "#795548",
    popular: false,
  },
];

export function CalculadorasContent() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
          py: { xs: 6, md: 10 },
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Chip
              icon={<Calculator size={16} />}
              label="100% Gratuito"
              color="primary"
              variant="outlined"
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Calculadoras Financeiras
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ maxWidth: 600 }}
            >
              Simule férias, 13º salário, rescisão e muito mais. Planeje suas
              finanças de forma simples e rápida.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Calculadoras Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Grid container spacing={3}>
          {calculadoras.map((calc) => {
            const IconComponent = calc.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={calc.id}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 24px ${alpha(calc.color, 0.2)}`,
                    },
                  }}
                >
                  <CardActionArea
                    component={Link}
                    href={`/calculadoras/${calc.id}`}
                    sx={{ height: "100%", p: 0 }}
                  >
                    <CardContent sx={{ height: "100%" }}>
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: alpha(calc.color, 0.1),
                              color: calc.color,
                            }}
                          >
                            <IconComponent size={24} />
                          </Box>
                          {calc.popular && (
                            <Chip
                              label="Popular"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                          {calc.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {calc.description}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          py: { xs: 6, md: 8 },
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography variant="h4" fontWeight={700}>
              Quer ir além das calculadoras?
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={500}>
              Com o Gastometria você controla suas finanças de forma completa:
              carteiras, orçamentos, metas, parcelamentos e muito mais. Tudo com
              inteligência artificial para te ajudar.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Link href="/register" passHref>
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 4,
                    py: 1.5,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderRadius: 2,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "primary.dark",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Criar Conta Grátis
                </Box>
              </Link>
              <Link href="/#features" passHref>
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 4,
                    py: 1.5,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Conhecer Recursos
                </Box>
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
