// src/app/(marketing)/calculadoras/imposto-renda/ir-calculator.tsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Calculator,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  TrendingDown,
  Info,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Tabela INSS 2024
const INSS_BRACKETS = [
  { min: 0, max: 1412.0, rate: 0.075 },
  { min: 1412.0, max: 2666.68, rate: 0.09 },
  { min: 2666.68, max: 4000.03, rate: 0.12 },
  { min: 4000.03, max: 7786.02, rate: 0.14 },
];
const INSS_MAX = 908.85;

// Tabela IR 2024
const IR_BRACKETS = [
  { min: 0, max: 2259.2, rate: 0, deduction: 0 },
  { min: 2259.2, max: 2826.65, rate: 0.075, deduction: 169.44 },
  { min: 2826.65, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { min: 3751.05, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { min: 4664.68, max: Infinity, rate: 0.275, deduction: 896.0 },
];

const DEPENDENT_DEDUCTION = 189.59;

function calculateINSS(salary: number): number {
  let total = 0;
  let previousMax = 0;

  for (const bracket of INSS_BRACKETS) {
    if (salary <= bracket.min) break;
    const taxable = Math.min(salary, bracket.max) - previousMax;
    if (taxable > 0) {
      total += taxable * bracket.rate;
    }
    previousMax = bracket.max;
  }

  return Math.min(total, INSS_MAX);
}

interface IRResult {
  grossSalary: number;
  inssDiscount: number;
  baseAfterINSS: number;
  dependentsDeduction: number;
  irBase: number;
  irDiscount: number;
  netSalary: number;
  bracket: {
    rate: number;
    deduction: number;
  };
  effectiveRate: number;
}

function calculateIR(grossSalary: number, dependents: number): IRResult {
  const inss = calculateINSS(grossSalary);
  const baseAfterINSS = grossSalary - inss;
  const dependentsDeduction = dependents * DEPENDENT_DEDUCTION;
  const irBase = baseAfterINSS - dependentsDeduction;

  let irDiscount = 0;
  let appliedBracket = IR_BRACKETS[0];

  for (const bracket of IR_BRACKETS) {
    if (irBase > bracket.min) {
      appliedBracket = bracket;
    }
  }

  if (irBase > IR_BRACKETS[0].max) {
    irDiscount = irBase * appliedBracket.rate - appliedBracket.deduction;
    irDiscount = Math.max(0, irDiscount);
  }

  const netSalary = grossSalary - inss - irDiscount;
  const effectiveRate = grossSalary > 0 ? (irDiscount / grossSalary) * 100 : 0;

  return {
    grossSalary,
    inssDiscount: inss,
    baseAfterINSS,
    dependentsDeduction,
    irBase,
    irDiscount,
    netSalary,
    bracket: {
      rate: appliedBracket.rate,
      deduction: appliedBracket.deduction,
    },
    effectiveRate,
  };
}

export function IRCalculator() {
  const theme = useTheme();
  const [salary, setSalary] = useState<string>("");
  const [dependents, setDependents] = useState<number>(0);
  const [result, setResult] = useState<IRResult | null>(null);

  const handleCalculate = () => {
    const salaryValue = parseFloat(salary.replace(/\D/g, "")) / 100;
    if (salaryValue <= 0) return;

    const calculated = calculateIR(salaryValue, dependents);
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
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, #f4433610 100%)`,
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
                bgcolor: alpha("#f44336", 0.1),
                color: "#f44336",
              }}
            >
              <Calculator size={28} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Calculadora de Imposto de Renda
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Calcule o IR na fonte com a tabela 2024
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
                    Dados para o cálculo
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

                  <FormControl fullWidth>
                    <InputLabel>Dependentes</InputLabel>
                    <Select
                      value={dependents}
                      label="Dependentes"
                      onChange={(e) => setDependents(Number(e.target.value))}
                    >
                      <MenuItem value={0}>Nenhum</MenuItem>
                      <MenuItem value={1}>1 dependente</MenuItem>
                      <MenuItem value={2}>2 dependentes</MenuItem>
                      <MenuItem value={3}>3 dependentes</MenuItem>
                      <MenuItem value={4}>4 dependentes</MenuItem>
                      <MenuItem value={5}>5 ou mais</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCalculate}
                    startIcon={<Calculator size={20} />}
                    disabled={!salary}
                    fullWidth
                  >
                    Calcular IR
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Tabela IR 2024 */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Tabela IR 2024
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Base de Cálculo</TableCell>
                        <TableCell align="right">Alíquota</TableCell>
                        <TableCell align="right">Dedução</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Até R$ 2.259,20</TableCell>
                        <TableCell align="right">Isento</TableCell>
                        <TableCell align="right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>R$ 2.259,21 - R$ 2.826,65</TableCell>
                        <TableCell align="right">7,5%</TableCell>
                        <TableCell align="right">R$ 169,44</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>R$ 2.826,66 - R$ 3.751,05</TableCell>
                        <TableCell align="right">15%</TableCell>
                        <TableCell align="right">R$ 381,44</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>R$ 3.751,06 - R$ 4.664,68</TableCell>
                        <TableCell align="right">22,5%</TableCell>
                        <TableCell align="right">R$ 662,77</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Acima de R$ 4.664,68</TableCell>
                        <TableCell align="right">27,5%</TableCell>
                        <TableCell align="right">R$ 896,00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Dedução por dependente: R$ 189,59
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Resultados */}
          <Grid size={{ xs: 12, md: 7 }}>
            {result ? (
              <Stack spacing={3}>
                {/* Desconto IR */}
                <Card
                  sx={{
                    border: 2,
                    borderColor:
                      result.irDiscount > 0 ? "error.main" : "success.main",
                    bgcolor: alpha(
                      result.irDiscount > 0
                        ? theme.palette.error.main
                        : theme.palette.success.main,
                      0.05
                    ),
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
                            {result.irDiscount > 0
                              ? "Imposto de Renda Retido"
                              : "Você está isento de IR!"}
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight={700}
                            color={
                              result.irDiscount > 0
                                ? "error.main"
                                : "success.main"
                            }
                          >
                            {result.irDiscount > 0
                              ? `- ${formatCurrency(result.irDiscount)}`
                              : "R$ 0,00"}
                          </Typography>
                        </Box>
                        <TrendingDown
                          size={40}
                          color={
                            result.irDiscount > 0
                              ? theme.palette.error.main
                              : theme.palette.success.main
                          }
                        />
                      </Stack>
                      {result.irDiscount > 0 && (
                        <>
                          <Divider />
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Alíquota da Faixa
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {(result.bracket.rate * 100).toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Alíquota Efetiva
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {result.effectiveRate.toFixed(2)}%
                              </Typography>
                            </Grid>
                          </Grid>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Salário Líquido */}
                <Card
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: 1,
                    borderColor: "success.main",
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Salário Líquido (após INSS e IR)
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatCurrency(result.netSalary)}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Detalhamento */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Info
                      size={16}
                      style={{ verticalAlign: "middle", marginRight: 8 }}
                    />
                    Detalhamento do Cálculo
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Salário Bruto</TableCell>
                          <TableCell align="right">
                            {formatCurrency(result.grossSalary)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>(-) Desconto INSS</TableCell>
                          <TableCell align="right" sx={{ color: "error.main" }}>
                            - {formatCurrency(result.inssDiscount)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>= Base após INSS</TableCell>
                          <TableCell align="right">
                            {formatCurrency(result.baseAfterINSS)}
                          </TableCell>
                        </TableRow>
                        {result.dependentsDeduction > 0 && (
                          <TableRow>
                            <TableCell>
                              (-) Dedução Dependentes ({dependents}x R$ 189,59)
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ color: "info.main" }}
                            >
                              - {formatCurrency(result.dependentsDeduction)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell>
                            <strong>= Base de Cálculo IR</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(result.irBase)}</strong>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>(-) Imposto de Renda</TableCell>
                          <TableCell align="right" sx={{ color: "error.main" }}>
                            - {formatCurrency(result.irDiscount)}
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell>
                            <strong>= Salário Líquido</strong>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ color: "success.main" }}
                          >
                            <strong>{formatCurrency(result.netSalary)}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* CTA */}
                <Alert
                  severity="success"
                  icon={<Sparkles size={20} />}
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}
                >
                  <Typography variant="body2">
                    <strong>Dica:</strong> Com o Gastometria você pode simular
                    diferentes cenários de salário e ver o impacto nos
                    descontos. Tudo com IA para te ajudar a planejar!
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
                  <Calculator size={48} color={theme.palette.text.disabled} />
                  <Typography color="text.secondary" textAlign="center">
                    Informe seu salário para calcular o IR
                  </Typography>
                </Stack>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* FAQ */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Perguntas Frequentes sobre Imposto de Renda
          </Typography>
          <Stack spacing={1}>
            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>O que é o IR na fonte?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  O Imposto de Renda Retido na Fonte (IRRF) é o imposto
                  descontado diretamente do seu salário pelo empregador e
                  repassado à Receita Federal. Ele é calculado com base na
                  tabela progressiva e considera deduções como dependentes e
                  INSS.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Quem está isento de IR?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Em 2024, quem tem renda mensal de até R$ 2.259,20 (após
                  descontar INSS e dependentes) está isento do Imposto de Renda.
                  Aposentados com mais de 65 anos têm uma isenção adicional.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  O que posso deduzir do IR?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Na fonte, você pode deduzir: contribuição ao INSS, dependentes
                  (R$ 189,59 por dependente) e pensão alimentícia judicial. Na
                  declaração anual, também pode deduzir despesas médicas,
                  educação, previdência privada (PGBL), entre outros.
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
                  O IR usa alíquotas progressivas, mas diferente do INSS, ele
                  aplica a alíquota sobre toda a base e depois subtrai a parcela
                  a deduzir. Por isso, mesmo que você esteja na faixa de 27,5%,
                  sua alíquota efetiva será menor.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
