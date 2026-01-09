// src/app/(marketing)/calculadoras/inss/inss-calculator.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  alpha,
  useTheme,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Receipt,
  Calculator,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  TrendingDown,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Tabela INSS 2024 (atualizada)
const INSS_BRACKETS_2024 = [
  { min: 0, max: 1412.0, rate: 0.075 },
  { min: 1412.0, max: 2666.68, rate: 0.09 },
  { min: 2666.68, max: 4000.03, rate: 0.12 },
  { min: 4000.03, max: 7786.02, rate: 0.14 },
];

const INSS_CEILING = 7786.02;
const INSS_MAX_CONTRIBUTION = 908.85;

interface INSSResult {
  grossSalary: number;
  inssDiscount: number;
  netAfterINSS: number;
  effectiveRate: number;
  brackets: {
    range: string;
    rate: number;
    base: number;
    contribution: number;
  }[];
}

function calculateINSS(grossSalary: number): INSSResult {
  let totalINSS = 0;
  let previousMax = 0;
  const brackets: INSSResult["brackets"] = [];

  for (const bracket of INSS_BRACKETS_2024) {
    if (grossSalary <= bracket.min) break;

    const taxableInBracket = Math.min(grossSalary, bracket.max) - previousMax;
    if (taxableInBracket > 0) {
      const contribution = taxableInBracket * bracket.rate;
      totalINSS += contribution;
      brackets.push({
        range: `${formatCurrency(previousMax)} - ${formatCurrency(
          bracket.max
        )}`,
        rate: bracket.rate,
        base: taxableInBracket,
        contribution,
      });
    }
    previousMax = bracket.max;
  }

  // Aplicar teto
  if (totalINSS > INSS_MAX_CONTRIBUTION) {
    totalINSS = INSS_MAX_CONTRIBUTION;
  }

  return {
    grossSalary,
    inssDiscount: totalINSS,
    netAfterINSS: grossSalary - totalINSS,
    effectiveRate: (totalINSS / grossSalary) * 100,
    brackets: brackets as any,
  };
}

export function INSSCalculator() {
  const theme = useTheme();
  const [salary, setSalary] = useState<string>("");
  const [result, setResult] = useState<INSSResult | null>(null);

  const handleCalculate = () => {
    const salaryValue = parseFloat(salary.replace(/\D/g, "")) / 100;
    if (salaryValue <= 0) return;

    const calculated = calculateINSS(salaryValue);
    setResult(calculated);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = (parseInt(value) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setSalary(value ? formatted : "");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, #00bcd410 100%)`,
          py: { xs: 4, md: 6 },
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Button
            component={Link}
            href="/calculadoras"
            startIcon={<ArrowLeft size={18} />}
            sx={{ mb: 2 }}
          >
            Voltar para Calculadoras
          </Button>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha("#00bcd4", 0.1),
                color: "#00bcd4",
              }}
            >
              <Receipt size={28} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Calculadora de INSS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Calcule o desconto do INSS com alíquotas 2024
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          {/* Formulário */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={600}>
                    Informe seu salário
                  </Typography>

                  <TextField
                    label="Salário Bruto"
                    value={salary}
                    onChange={handleCurrencyChange}
                    placeholder="0,00"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCalculate}
                    startIcon={<Calculator size={20} />}
                    disabled={!salary}
                    fullWidth
                  >
                    Calcular INSS
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Tabela INSS 2024 */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Tabela INSS 2024
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Faixa Salarial</TableCell>
                        <TableCell align="right">Alíquota</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Até R$ 1.412,00</TableCell>
                        <TableCell align="right">7,5%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>R$ 1.412,01 - R$ 2.666,68</TableCell>
                        <TableCell align="right">9%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>R$ 2.666,69 - R$ 4.000,03</TableCell>
                        <TableCell align="right">12%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>R$ 4.000,04 - R$ 7.786,02</TableCell>
                        <TableCell align="right">14%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Teto máximo de contribuição: R$ 908,85
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Resultados */}
          <Grid size={{ xs: 12, md: 7 }}>
            {result ? (
              <Stack spacing={3}>
                {/* Resumo Principal */}
                <Card
                  sx={{
                    border: 2,
                    borderColor: "error.main",
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Desconto do INSS
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight={700}
                            color="error.main"
                          >
                            - {formatCurrency(result.inssDiscount)}
                          </Typography>
                        </Box>
                        <TrendingDown
                          size={40}
                          color={theme.palette.error.main}
                        />
                      </Stack>
                      <Divider />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Salário Bruto
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(result.grossSalary)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Alíquota Efetiva
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {result.effectiveRate.toFixed(2)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Salário após INSS */}
                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Salário após INSS
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color="success.main"
                        >
                          {formatCurrency(result.netAfterINSS)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Base para cálculo do IR)
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Detalhamento por faixa */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Info
                      size={16}
                      style={{ verticalAlign: "middle", marginRight: 8 }}
                    />
                    Cálculo Progressivo por Faixa
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Faixa</TableCell>
                          <TableCell align="right">Alíquota</TableCell>
                          <TableCell align="right">Base</TableCell>
                          <TableCell align="right">Contribuição</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.brackets.map((bracket, index) => (
                          <TableRow key={index}>
                            <TableCell>{bracket.range}</TableCell>
                            <TableCell align="right">
                              {(bracket.rate * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(bracket.base)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(bracket.contribution)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3}>
                            <strong>Total INSS</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>
                              {formatCurrency(result.inssDiscount)}
                            </strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Alerta */}
                <Alert severity="info">
                  <Typography variant="body2">
                    O INSS usa alíquotas progressivas: cada faixa de salário tem
                    sua própria alíquota. Por isso a alíquota efetiva é menor
                    que a alíquota máxima da sua faixa.
                  </Typography>
                </Alert>

                {/* CTA */}
                <Alert
                  severity="success"
                  icon={<Sparkles size={20} />}
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}
                >
                  <Typography variant="body2">
                    <strong>Dica:</strong> Com o Gastometria você pode importar
                    seu holerite e ter todos os cálculos de INSS, IR e
                    benefícios automaticamente!
                  </Typography>
                  <Button
                    component={Link}
                    href="/register"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Criar conta grátis
                  </Button>
                </Alert>
              </Stack>
            ) : (
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                }}
              >
                <Stack alignItems="center" spacing={2} sx={{ p: 4 }}>
                  <Receipt size={48} color={theme.palette.text.disabled} />
                  <Typography color="text.secondary" textAlign="center">
                    Informe seu salário para calcular o INSS
                  </Typography>
                </Stack>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* FAQ */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Perguntas Frequentes sobre INSS
          </Typography>
          <Stack spacing={1}>
            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  O que é o desconto do INSS?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  O INSS (Instituto Nacional do Seguro Social) é a contribuição
                  previdenciária que todo trabalhador com carteira assinada
                  paga. Esse valor garante benefícios como aposentadoria,
                  auxílio-doença, salário-maternidade, entre outros.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Como funciona a alíquota progressiva?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  A alíquota do INSS é progressiva, ou seja, cada faixa de
                  salário tem sua própria alíquota. Por exemplo, se você ganha
                  R$ 3.000, paga 7,5% sobre os primeiros R$ 1.412, 9% sobre a
                  faixa seguinte, e assim por diante. Isso resulta em uma
                  alíquota efetiva menor.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Existe um teto de contribuição?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Sim! Em 2024, o teto do INSS é R$ 7.786,02. Mesmo que você
                  ganhe mais que esse valor, a contribuição máxima será de R$
                  908,85 por mês.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  O INSS é descontado antes do IR?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Sim! O INSS é descontado primeiro, e o Imposto de Renda é
                  calculado sobre o salário já deduzido do INSS. Por isso, pagar
                  INSS reduz a base de cálculo do IR.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
