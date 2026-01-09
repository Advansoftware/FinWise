// src/app/(marketing)/calculadoras/decimo-terceiro/thirteenth-calculator.tsx

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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Gift,
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

export function PublicThirteenthSalaryCalculator() {
  const theme = useTheme();
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [monthsWorked, setMonthsWorked] = useState<number>(12);
  const [dependents, setDependents] = useState<number>(0);
  const [installment, setInstallment] = useState<"first" | "second" | "both">(
    "both"
  );
  const [result, setResult] = useState<{
    proportionalSalary: number;
    firstInstallment: number;
    secondInstallmentGross: number;
    inss: number;
    ir: number;
    secondInstallmentNet: number;
    totalNet: number;
  } | null>(null);

  const handleCalculate = () => {
    const salary = parseFloat(
      grossSalary.replace(/[^\d,]/g, "").replace(",", ".")
    );
    if (!salary || salary <= 0) return;

    // 13º proporcional aos meses trabalhados
    const proportionalSalary = (salary / 12) * monthsWorked;

    // 1ª parcela: metade do proporcional, sem descontos
    const firstInstallment = proportionalSalary / 2;

    // 2ª parcela: outra metade, COM descontos
    const secondInstallmentGross = proportionalSalary / 2;

    // Descontos são calculados sobre o valor TOTAL do 13º
    const inss = calculateINSS(proportionalSalary);
    const dependentDeduction = dependents * 189.59; // Dedução por dependente 2024
    const baseIR = proportionalSalary - inss - dependentDeduction;
    const ir = calculateIR(baseIR);

    // Na 2ª parcela são descontados todos os impostos
    const secondInstallmentNet = secondInstallmentGross - inss - ir;
    const totalNet = firstInstallment + secondInstallmentNet;

    setResult({
      proportionalSalary,
      firstInstallment,
      secondInstallmentGross,
      inss,
      ir,
      secondInstallmentNet,
      totalNet,
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
          background: `linear-gradient(135deg, ${alpha(
            "#4caf50",
            0.1
          )} 0%, ${alpha("#4caf50", 0.05)} 100%)`,
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
                  bgcolor: alpha("#4caf50", 0.1),
                  color: "#4caf50",
                }}
              >
                <Gift size={28} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Calculadora de 13º Salário
                </Typography>
                <Typography color="text.secondary">
                  Simule a 1ª e 2ª parcela do seu décimo terceiro
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
                    helperText="Seu salário bruto atual"
                  />

                  <TextField
                    label="Meses Trabalhados no Ano"
                    type="number"
                    value={monthsWorked}
                    onChange={(e) =>
                      setMonthsWorked(
                        Math.max(
                          1,
                          Math.min(12, parseInt(e.target.value) || 12)
                        )
                      )
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 12 }}
                    helperText="De 1 a 12 meses (para cálculo proporcional)"
                  />

                  <TextField
                    label="Número de Dependentes"
                    type="number"
                    value={dependents}
                    onChange={(e) =>
                      setDependents(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    fullWidth
                    inputProps={{ min: 0 }}
                    helperText="Dedução de R$ 189,59 por dependente no IR"
                  />

                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Visualizar parcelas
                    </Typography>
                    <ToggleButtonGroup
                      value={installment}
                      exclusive
                      onChange={(_, value) => value && setInstallment(value)}
                      fullWidth
                      size="small"
                    >
                      <ToggleButton value="first">1ª Parcela</ToggleButton>
                      <ToggleButton value="second">2ª Parcela</ToggleButton>
                      <ToggleButton value="both">Ambas</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCalculate}
                    startIcon={<Calculator size={20} />}
                    fullWidth
                    sx={{
                      bgcolor: "#4caf50",
                      "&:hover": { bgcolor: "#388e3c" },
                    }}
                  >
                    Calcular 13º Salário
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Info size={18} color={theme.palette.info.main} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Quando recebo o 13º?
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    A <strong>1ª parcela</strong> deve ser paga até 30 de
                    novembro (ou junto com as férias, se solicitado). A{" "}
                    <strong>2ª parcela</strong> deve ser paga até 20 de
                    dezembro.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Resultado */}
          <Grid size={{ xs: 12, md: 7 }}>
            {result ? (
              <Stack spacing={3}>
                {/* Valor Total */}
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
                      Total Líquido do 13º Salário
                    </Typography>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatCurrency(result.totalNet)}
                    </Typography>
                    <Chip
                      label={`${monthsWorked} meses trabalhados`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Stack>
                </Paper>

                {/* Parcelas */}
                <Grid container spacing={2}>
                  {(installment === "first" || installment === "both") && (
                    <Grid
                      size={{ xs: 12, sm: installment === "both" ? 6 : 12 }}
                    >
                      <Card>
                        <CardContent>
                          <Typography variant="overline" color="text.secondary">
                            1ª Parcela (até 30/Nov)
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight={700}
                            color="primary.main"
                          >
                            {formatCurrency(result.firstInstallment)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sem descontos de INSS e IR
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  {(installment === "second" || installment === "both") && (
                    <Grid
                      size={{ xs: 12, sm: installment === "both" ? 6 : 12 }}
                    >
                      <Card>
                        <CardContent>
                          <Typography variant="overline" color="text.secondary">
                            2ª Parcela (até 20/Dez)
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight={700}
                            color="primary.main"
                          >
                            {formatCurrency(result.secondInstallmentNet)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Com descontos de INSS e IR
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>

                {/* Detalhamento */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Detalhamento do Cálculo
                    </Typography>

                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          gutterBottom
                        >
                          Base de Cálculo
                        </Typography>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2">
                              13º Proporcional ({monthsWorked}/12 avos)
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(result.proportionalSalary)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          gutterBottom
                        >
                          Descontos (aplicados na 2ª parcela)
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
                    <strong>Planeje seu 13º!</strong> Com o Gastometria você
                    pode criar metas e acompanhar como usar seu décimo terceiro
                    da melhor forma.{" "}
                    <Link
                      href="/register"
                      style={{ color: "inherit", fontWeight: 600 }}
                    >
                      Comece grátis →
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
                <Gift size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Preencha os dados ao lado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Informe seu salário e meses trabalhados para calcular seu 13º.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* FAQ Section */}
      <Box sx={{ bgcolor: "background.paper", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Perguntas Frequentes sobre 13º Salário
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Quem tem direito ao 13º salário?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Todo trabalhador com carteira assinada, empregados domésticos,
                trabalhadores rurais, avulsos e aposentados/pensionistas do INSS
                têm direito ao 13º salário.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Como é calculado o 13º proporcional?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Para cada mês trabalhado (15 dias ou mais), você tem direito a
                1/12 do 13º. Se trabalhou o ano inteiro, recebe o valor cheio.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                A 1ª parcela tem descontos?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Não! A 1ª parcela é paga sem nenhum desconto. Os descontos de
                INSS e IR incidem apenas na 2ª parcela.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Posso receber o 13º junto com as férias?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sim! Você pode solicitar ao empregador o adiantamento da 1ª
                parcela do 13º junto com as férias, desde que faça o pedido até
                janeiro do ano.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
