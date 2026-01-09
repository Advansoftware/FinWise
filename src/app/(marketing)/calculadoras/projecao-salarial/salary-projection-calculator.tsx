// src/app/(marketing)/calculadoras/projecao-salarial/salary-projection-calculator.tsx
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
  Slider,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Calculator,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProjectionYear {
  year: number;
  nominalSalary: number;
  realSalary: number;
  nominalGrowth: number;
  realGrowth: number;
  accumulatedInflation: number;
}

interface ProjectionResult {
  currentSalary: number;
  annualRaise: number;
  inflationRate: number;
  years: number;
  projections: ProjectionYear[];
  finalNominal: number;
  finalReal: number;
  totalNominalGrowth: number;
  totalRealGrowth: number;
}

function calculateProjection(
  currentSalary: number,
  annualRaise: number,
  inflationRate: number,
  years: number
): ProjectionResult {
  const projections: ProjectionYear[] = [];

  let nominalSalary = currentSalary;
  let accumulatedInflation = 0;

  for (let year = 0; year <= years; year++) {
    accumulatedInflation =
      year === 0
        ? 0
        : (1 + accumulatedInflation / 100) * (1 + inflationRate / 100) * 100 -
          100;

    if (year > 0) {
      nominalSalary = nominalSalary * (1 + annualRaise / 100);
    }

    const realSalary =
      nominalSalary /
      (year === 0 ? 1 : Math.pow(1 + inflationRate / 100, year));

    projections.push({
      year: new Date().getFullYear() + year,
      nominalSalary,
      realSalary,
      nominalGrowth:
        year === 0
          ? 0
          : ((nominalSalary - currentSalary) / currentSalary) * 100,
      realGrowth:
        year === 0 ? 0 : ((realSalary - currentSalary) / currentSalary) * 100,
      accumulatedInflation,
    });
  }

  const finalProjection = projections[projections.length - 1];

  return {
    currentSalary,
    annualRaise,
    inflationRate,
    years,
    projections,
    finalNominal: finalProjection.nominalSalary,
    finalReal: finalProjection.realSalary,
    totalNominalGrowth: finalProjection.nominalGrowth,
    totalRealGrowth: finalProjection.realGrowth,
  };
}

export function SalaryProjectionCalculator() {
  const theme = useTheme();
  const [salary, setSalary] = useState<string>("");
  const [annualRaise, setAnnualRaise] = useState<number>(5);
  const [inflationRate, setInflationRate] = useState<number>(4);
  const [years, setYears] = useState<number>(5);
  const [result, setResult] = useState<ProjectionResult | null>(null);

  const handleCalculate = () => {
    const salaryValue = parseFloat(salary.replace(/\D/g, "")) / 100;
    if (salaryValue <= 0) return;

    const calculated = calculateProjection(
      salaryValue,
      annualRaise,
      inflationRate,
      years
    );
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
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, #2196f310 100%)`,
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
                bgcolor: alpha("#2196f3", 0.1),
                color: "#2196f3",
              }}
            >
              <TrendingUp size={28} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Calculadora de Projeção Salarial
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Simule a evolução do seu salário ao longo dos anos
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
                    Dados para Projeção
                  </Typography>

                  <TextField
                    label="Salário Atual"
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

                  <Box>
                    <Typography gutterBottom>
                      Reajuste Anual Esperado: {annualRaise}%
                    </Typography>
                    <Slider
                      value={annualRaise}
                      onChange={(_, value) => setAnnualRaise(value as number)}
                      min={0}
                      max={20}
                      step={0.5}
                      marks={[
                        { value: 0, label: "0%" },
                        { value: 5, label: "5%" },
                        { value: 10, label: "10%" },
                        { value: 15, label: "15%" },
                        { value: 20, label: "20%" },
                      ]}
                    />
                  </Box>

                  <Box>
                    <Typography gutterBottom>
                      Inflação Estimada: {inflationRate}%
                    </Typography>
                    <Slider
                      value={inflationRate}
                      onChange={(_, value) => setInflationRate(value as number)}
                      min={0}
                      max={15}
                      step={0.5}
                      marks={[
                        { value: 0, label: "0%" },
                        { value: 5, label: "5%" },
                        { value: 10, label: "10%" },
                        { value: 15, label: "15%" },
                      ]}
                    />
                  </Box>

                  <Box>
                    <Typography gutterBottom>Período: {years} anos</Typography>
                    <Slider
                      value={years}
                      onChange={(_, value) => setYears(value as number)}
                      min={1}
                      max={20}
                      step={1}
                      marks={[
                        { value: 1, label: "1" },
                        { value: 5, label: "5" },
                        { value: 10, label: "10" },
                        { value: 15, label: "15" },
                        { value: 20, label: "20" },
                      ]}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCalculate}
                    startIcon={<Calculator size={20} />}
                    disabled={!salary}
                    fullWidth
                  >
                    Calcular Projeção
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <Info
                      size={16}
                      style={{ verticalAlign: "middle", marginRight: 8 }}
                    />
                    Referências de Mercado
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <Chip
                      label="IPCA 2023: 4,62%"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Reajuste CLT: ~5-7%"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Salário mínimo 2024: 7,7%"
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Resultados */}
          <Grid size={{ xs: 12, md: 7 }}>
            {result ? (
              <Stack spacing={3}>
                {/* Resumo */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: 1,
                        borderColor: "primary.main",
                      }}
                    >
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Salário em {years} anos (Nominal)
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {formatCurrency(result.finalNominal)}
                        </Typography>
                        <Chip
                          label={`+${result.totalNominalGrowth.toFixed(1)}%`}
                          size="small"
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                      sx={{
                        bgcolor: alpha(
                          result.totalRealGrowth >= 0
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          0.05
                        ),
                        border: 1,
                        borderColor:
                          result.totalRealGrowth >= 0
                            ? "success.main"
                            : "error.main",
                      }}
                    >
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Poder de Compra Real
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color={
                            result.totalRealGrowth >= 0
                              ? "success.main"
                              : "error.main"
                          }
                        >
                          {formatCurrency(result.finalReal)}
                        </Typography>
                        <Chip
                          label={`${
                            result.totalRealGrowth >= 0 ? "+" : ""
                          }${result.totalRealGrowth.toFixed(1)}%`}
                          size="small"
                          color={
                            result.totalRealGrowth >= 0 ? "success" : "error"
                          }
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Tabela de Projeção */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Evolução Ano a Ano
                  </Typography>
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ano</TableCell>
                          <TableCell align="right">Salário Nominal</TableCell>
                          <TableCell align="right">Valor Real*</TableCell>
                          <TableCell align="right">Crescimento Real</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.projections.map((proj) => (
                          <TableRow
                            key={proj.year}
                            sx={{
                              bgcolor:
                                proj.year === new Date().getFullYear()
                                  ? "action.selected"
                                  : undefined,
                            }}
                          >
                            <TableCell>
                              {proj.year}
                              {proj.year === new Date().getFullYear() && (
                                <Chip
                                  label="Atual"
                                  size="small"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(proj.nominalSalary)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(proj.realSalary)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color:
                                  proj.realGrowth >= 0
                                    ? "success.main"
                                    : "error.main",
                              }}
                            >
                              {proj.realGrowth === 0
                                ? "-"
                                : `${
                                    proj.realGrowth >= 0 ? "+" : ""
                                  }${proj.realGrowth.toFixed(1)}%`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    * Valor Real: Poder de compra considerando a inflação
                  </Typography>
                </Paper>

                {/* CTA */}
                <Alert
                  severity="success"
                  icon={<Sparkles size={20} />}
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}
                >
                  <Typography variant="body2">
                    <strong>Dica:</strong> Acompanhe sua evolução salarial real
                    com o Gastometria! A IA analisa seus ganhos e te ajuda a
                    negociar melhores aumentos.
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
                  <TrendingUp size={48} color={theme.palette.text.disabled} />
                  <Typography color="text.secondary" textAlign="center">
                    Informe seu salário atual para projetar a evolução
                  </Typography>
                </Stack>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* FAQ */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Perguntas Frequentes sobre Projeção Salarial
          </Typography>
          <Stack spacing={1}>
            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  O que é salário nominal vs real?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  O salário nominal é o valor escrito no contracheque. Já o
                  salário real leva em conta a inflação - ou seja, o quanto você
                  realmente consegue comprar. Se seu salário aumenta 5% mas a
                  inflação foi 4%, seu ganho real foi só 1%.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Qual reajuste devo esperar?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Varia muito por setor e cargo. Em geral, convenções coletivas
                  garantem reajustes próximos à inflação (IPCA). Promoções podem
                  dar 10-30%. Áreas de tecnologia costumam ter reajustes
                  maiores. Use o IPCA como mínimo para não perder poder de
                  compra.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Como negociar um aumento?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Use dados: pesquise salários do mercado, documente suas
                  entregas e resultados. Mostre quanto você agregou à empresa.
                  Considere o momento certo (após bons resultados, fechamento de
                  projetos). Peça acima do que espera para ter margem.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Por que acompanhar a inflação?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Se seu salário não acompanha a inflação, você está perdendo
                  dinheiro mesmo "mantendo" o mesmo valor. É como se você
                  tivesse um corte de salário invisível. Por isso é importante
                  negociar reajustes ao menos iguais à inflação do período.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
