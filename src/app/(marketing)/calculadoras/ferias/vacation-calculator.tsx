// src/app/(marketing)/calculadoras/ferias/vacation-calculator.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  Paper,
  Chip,
  useTheme,
  alpha,
  InputAdornment,
  Divider,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Plane,
  Calculator,
  Info,
  CheckCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Tabelas de INSS e IR 2024
const INSS_BRACKETS = [
  { min: 0, max: 1412.0, rate: 0.075 },
  { min: 1412.01, max: 2666.68, rate: 0.09 },
  { min: 2666.69, max: 4000.03, rate: 0.12 },
  { min: 4000.04, max: 7786.02, rate: 0.14 },
];

const IR_BRACKETS = [
  { min: 0, max: 2259.2, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.0 },
];

function calculateINSS(salary: number): number {
  let inss = 0;
  let remainingSalary = salary;

  for (let i = 0; i < INSS_BRACKETS.length && remainingSalary > 0; i++) {
    const bracket = INSS_BRACKETS[i];
    const previousMax = i > 0 ? INSS_BRACKETS[i - 1].max : 0;
    const taxableAmount = Math.min(remainingSalary, bracket.max - previousMax);
    inss += taxableAmount * bracket.rate;
    remainingSalary -= taxableAmount;
  }

  // Teto do INSS 2024
  return Math.min(inss, 908.85);
}

function calculateIR(baseIR: number): number {
  for (const bracket of IR_BRACKETS) {
    if (baseIR <= bracket.max) {
      return Math.max(0, baseIR * bracket.rate - bracket.deduction);
    }
  }
  const lastBracket = IR_BRACKETS[IR_BRACKETS.length - 1];
  return baseIR * lastBracket.rate - lastBracket.deduction;
}

export function PublicVacationCalculator() {
  const theme = useTheme();
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [vacationDays, setVacationDays] = useState<number>(30);
  const [result, setResult] = useState<{
    vacationSalary: number;
    oneThirdBonus: number;
    grossTotal: number;
    inss: number;
    ir: number;
    netTotal: number;
  } | null>(null);

  const handleCalculate = () => {
    const salary = parseFloat(
      grossSalary.replace(/[^\d,]/g, "").replace(",", ".")
    );
    if (!salary || salary <= 0) return;

    // Cálculo proporcional ao período de férias
    const dailySalary = salary / 30;
    const vacationSalary = dailySalary * vacationDays;
    const oneThirdBonus = vacationSalary / 3;
    const grossTotal = vacationSalary + oneThirdBonus;

    // Descontos
    const inss = calculateINSS(grossTotal);
    const baseIR = grossTotal - inss;
    const ir = calculateIR(baseIR);

    const netTotal = grossTotal - inss - ir;

    setResult({
      vacationSalary,
      oneThirdBonus,
      grossTotal,
      inss,
      ir,
      netTotal,
    });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value) {
      const formatted = (parseInt(value) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setGrossSalary(formatted);
    } else {
      setGrossSalary("");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${alpha("#2196f3", 0.1)} 0%, ${alpha(
              "#2196f3",
              0.05
            )} 100%)`,
          py: { xs: 4, md: 6 },
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={2}>
            <Link
              href="/calculadoras"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "inherit",
                textDecoration: "none",
                opacity: 0.7,
              }}
            >
              <ArrowLeft size={16} />
              <Typography variant="body2">Voltar às calculadoras</Typography>
            </Link>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#2196f3", 0.1),
                  color: "#2196f3",
                }}
              >
                <Plane size={28} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Calculadora de Férias
                </Typography>
                <Typography color="text.secondary">
                  Calcule o valor líquido das suas férias com precisão
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={4}>
          {/* Formulário */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={600}>
                    Dados para Cálculo
                  </Typography>

                  <TextField
                    label="Salário Bruto Mensal"
                    value={grossSalary}
                    onChange={handleSalaryChange}
                    placeholder="0,00"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                    helperText="Informe seu salário bruto mensal (antes dos descontos)"
                  />

                  <TextField
                    label="Dias de Férias"
                    type="number"
                    value={vacationDays}
                    onChange={(e) =>
                      setVacationDays(
                        Math.max(
                          10,
                          Math.min(30, parseInt(e.target.value) || 30)
                        )
                      )
                    }
                    fullWidth
                    inputProps={{ min: 10, max: 30 }}
                    helperText="Mínimo 10 dias, máximo 30 dias"
                  />

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCalculate}
                    startIcon={<Calculator size={20} />}
                    fullWidth
                  >
                    Calcular Férias
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Info size={18} color={theme.palette.info.main} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Como funciona o cálculo?
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    As férias são calculadas com base no seu salário bruto
                    proporcional aos dias de descanso, acrescido de 1/3
                    constitucional. São descontados INSS e Imposto de Renda na
                    fonte conforme as tabelas vigentes.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Resultado */}
          <Grid size={{ xs: 12, md: 7 }}>
            {result ? (
              <Stack spacing={3}>
                {/* Valor Líquido */}
                <Paper
                  sx={{
                    p: 3,
                    background: `linear-gradient(135deg, ${alpha(
                      "#4caf50",
                      0.1
                    )} 0%, ${alpha("#4caf50", 0.05)} 100%)`,
                    border: 1,
                    borderColor: alpha("#4caf50", 0.2),
                  }}
                >
                  <Stack spacing={1} alignItems="center">
                    <CheckCircle size={32} color="#4caf50" />
                    <Typography variant="body2" color="text.secondary">
                      Valor Líquido das Férias
                    </Typography>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatCurrency(result.netTotal)}
                    </Typography>
                    <Chip
                      label={`${vacationDays} dias de férias`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Stack>
                </Paper>

                {/* Detalhamento */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Detalhamento do Cálculo
                    </Typography>

                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {/* Proventos */}
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          gutterBottom
                        >
                          Proventos
                        </Typography>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2">
                              Férias ({vacationDays} dias)
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(result.vacationSalary)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2">
                              1/3 Constitucional
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(result.oneThirdBonus)}
                            </Typography>
                          </Box>
                          <Divider />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              Total Bruto
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="success.main"
                            >
                              {formatCurrency(result.grossTotal)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Descontos */}
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          gutterBottom
                        >
                          Descontos
                        </Typography>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2">INSS</Typography>
                            <Typography variant="body2" color="error.main">
                              - {formatCurrency(result.inss)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2">
                              Imposto de Renda
                            </Typography>
                            <Typography variant="body2" color="error.main">
                              - {formatCurrency(result.ir)}
                            </Typography>
                          </Box>
                          <Divider />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              Total Descontos
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="error.main"
                            >
                              - {formatCurrency(result.inss + result.ir)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* CTA Sutil */}
                <Alert
                  severity="info"
                  icon={<Sparkles size={20} />}
                  sx={{
                    "& .MuiAlert-icon": { color: "primary.main" },
                  }}
                >
                  <Typography variant="body2">
                    <strong>Dica:</strong> Com o Gastometria você pode
                    acompanhar suas finanças, planejar o uso das férias e muito
                    mais.{" "}
                    <Link
                      href="/register"
                      style={{ color: "inherit", fontWeight: 600 }}
                    >
                      Crie sua conta grátis →
                    </Link>
                  </Typography>
                </Alert>
              </Stack>
            ) : (
              <Paper
                sx={{
                  p: 6,
                  textAlign: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  border: 1,
                  borderColor: "divider",
                  borderStyle: "dashed",
                }}
              >
                <Plane size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Preencha os dados ao lado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Informe seu salário bruto e os dias de férias para ver o
                  cálculo completo.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* FAQ Section para SEO */}
      <Box sx={{ bgcolor: "background.paper", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Perguntas Frequentes sobre Férias
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                O que é o 1/3 constitucional de férias?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                É um adicional de 1/3 sobre o valor das férias garantido pela
                Constituição Federal. Se você tirar 30 dias de férias, receberá
                o salário integral mais 1/3 desse valor.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Posso vender parte das férias?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sim, você pode converter até 1/3 das férias (10 dias) em
                dinheiro, prática conhecida como "abono pecuniário". Nesse caso,
                tira 20 dias de férias e recebe os 10 dias em dinheiro.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Quando as férias devem ser pagas?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                O pagamento deve ser feito até 2 dias antes do início das
                férias. O empregador que atrasar está sujeito ao pagamento em
                dobro.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Qual o período mínimo de férias?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As férias podem ser divididas em até 3 períodos, sendo que um
                deles não pode ser inferior a 14 dias e os demais não podem ser
                inferiores a 5 dias cada.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
