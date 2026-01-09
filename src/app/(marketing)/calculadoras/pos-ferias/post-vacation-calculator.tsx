// src/app/(marketing)/calculadoras/pos-ferias/post-vacation-calculator.tsx
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
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Calculator,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Tabela INSS 2024 progressiva
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

function calculateIR(baseCalculo: number): number {
  let appliedBracket = IR_BRACKETS[0];

  for (const bracket of IR_BRACKETS) {
    if (baseCalculo > bracket.min) {
      appliedBracket = bracket;
    }
  }

  if (baseCalculo <= IR_BRACKETS[0].max) {
    return 0;
  }

  return Math.max(
    0,
    baseCalculo * appliedBracket.rate - appliedBracket.deduction
  );
}

interface PostVacationResult {
  grossSalary: number;
  vacationDays: number;
  daysWorkedInMonth: number;
  totalDaysInMonth: number;
  proportionalSalary: number;
  inssDiscount: number;
  irDiscount: number;
  netSalary: number;
  difference: number;
  normalNetSalary: number;
}

function calculatePostVacation(
  grossSalary: number,
  vacationDays: number,
  startDayOfMonth: number,
  daysInMonth: number
): PostVacationResult {
  // Dias que ele realmente vai trabalhar e receber nesse mês
  // Se férias terminam no dia X, ele trabalha do dia X+1 até o fim do mês
  const daysWorked = Math.max(0, daysInMonth - startDayOfMonth + 1);

  // Salário proporcional aos dias trabalhados
  const proportionalSalary = (grossSalary / 30) * daysWorked;

  // Descontos sobre o proporcional
  const inss = calculateINSS(proportionalSalary);
  const irBase = proportionalSalary - inss;
  const ir = calculateIR(irBase);

  const netSalary = proportionalSalary - inss - ir;

  // Salário líquido normal para comparação
  const normalInss = calculateINSS(grossSalary);
  const normalIrBase = grossSalary - normalInss;
  const normalIr = calculateIR(normalIrBase);
  const normalNetSalary = grossSalary - normalInss - normalIr;

  return {
    grossSalary,
    vacationDays,
    daysWorkedInMonth: daysWorked,
    totalDaysInMonth: daysInMonth,
    proportionalSalary,
    inssDiscount: inss,
    irDiscount: ir,
    netSalary,
    difference: netSalary - normalNetSalary,
    normalNetSalary,
  };
}

export function PostVacationCalculator() {
  const theme = useTheme();
  const [salary, setSalary] = useState<string>("");
  const [vacationDays, setVacationDays] = useState<number>(30);
  const [returnDay, setReturnDay] = useState<number>(15);
  const [daysInMonth, setDaysInMonth] = useState<number>(30);
  const [result, setResult] = useState<PostVacationResult | null>(null);

  const handleCalculate = () => {
    const salaryValue = parseFloat(salary.replace(/\D/g, "")) / 100;
    if (salaryValue <= 0) return;

    const calculated = calculatePostVacation(
      salaryValue,
      vacationDays,
      returnDay,
      daysInMonth
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
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, #ff980010 100%)`,
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
                bgcolor: alpha("#ff9800", 0.1),
                color: "#ff9800",
              }}
            >
              <Calendar size={28} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Calculadora Pós-Férias
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Descubra quanto vai receber no retorno das férias
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
                    <InputLabel>Dias de Férias</InputLabel>
                    <Select
                      value={vacationDays}
                      label="Dias de Férias"
                      onChange={(e) => setVacationDays(Number(e.target.value))}
                    >
                      <MenuItem value={10}>10 dias (1º período)</MenuItem>
                      <MenuItem value={15}>15 dias</MenuItem>
                      <MenuItem value={20}>20 dias (2º período)</MenuItem>
                      <MenuItem value={30}>30 dias (férias inteiras)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Dia de Retorno ao Trabalho</InputLabel>
                    <Select
                      value={returnDay}
                      label="Dia de Retorno ao Trabalho"
                      onChange={(e) => setReturnDay(Number(e.target.value))}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(
                        (day) => (
                          <MenuItem key={day} value={day}>
                            Dia {day} do mês
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Dias do Mês</InputLabel>
                    <Select
                      value={daysInMonth}
                      label="Dias do Mês"
                      onChange={(e) => setDaysInMonth(Number(e.target.value))}
                    >
                      <MenuItem value={28}>28 dias (Fevereiro)</MenuItem>
                      <MenuItem value={29}>
                        29 dias (Fevereiro bissexto)
                      </MenuItem>
                      <MenuItem value={30}>30 dias</MenuItem>
                      <MenuItem value={31}>31 dias</MenuItem>
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
                    Calcular Salário Pós-Férias
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Explicação */}
            <Alert
              severity="info"
              icon={<AlertCircle size={20} />}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                No mês de retorno das férias, você recebe apenas pelos dias
                trabalhados. O salário das férias já foi pago antecipadamente!
              </Typography>
            </Alert>
          </Grid>

          {/* Resultados */}
          <Grid size={{ xs: 12, md: 7 }}>
            {result ? (
              <Stack spacing={3}>
                {/* Alerta Principal */}
                <Card
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    border: 2,
                    borderColor: "warning.main",
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <AlertCircle
                        size={40}
                        color={theme.palette.warning.main}
                      />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Você vai receber no mês de retorno:
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          color="warning.main"
                        >
                          {formatCurrency(result.netSalary)}
                        </Typography>
                        <Chip
                          label={`${formatCurrency(
                            result.difference
                          )} a menos que o normal`}
                          size="small"
                          color="warning"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Comparativo */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Card sx={{ bgcolor: "action.hover" }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Salário Líquido Normal
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {formatCurrency(result.normalNetSalary)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (30 dias trabalhados)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Card
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        border: 1,
                        borderColor: "warning.main",
                      }}
                    >
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">
                          Salário Pós-Férias
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          color="warning.main"
                        >
                          {formatCurrency(result.netSalary)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({result.daysWorkedInMonth} dias trabalhados)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

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
                          <TableCell>Dias trabalhados no mês</TableCell>
                          <TableCell align="right">
                            {result.daysWorkedInMonth} de{" "}
                            {result.totalDaysInMonth} dias
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Salário Proporcional (bruto)</TableCell>
                          <TableCell align="right">
                            {formatCurrency(result.proportionalSalary)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>(-) INSS</TableCell>
                          <TableCell align="right" sx={{ color: "error.main" }}>
                            - {formatCurrency(result.inssDiscount)}
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
                            sx={{ color: "warning.main" }}
                          >
                            <strong>{formatCurrency(result.netSalary)}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Dica de Planejamento */}
                <Alert
                  severity="success"
                  icon={<Sparkles size={20} />}
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}
                >
                  <Typography variant="body2">
                    <strong>Dica:</strong> Reserve parte do adiantamento de
                    férias para cobrir esse mês mais "curto"! Com o Gastometria
                    você pode planejar isso automaticamente.
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
                  <Calendar size={48} color={theme.palette.text.disabled} />
                  <Typography color="text.secondary" textAlign="center">
                    Informe os dados para calcular o salário pós-férias
                  </Typography>
                </Stack>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* FAQ */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Perguntas Frequentes sobre Pós-Férias
          </Typography>
          <Stack spacing={1}>
            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Por que recebo menos no mês de retorno?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Porque você já recebeu o salário das férias antecipadamente
                  (junto com o 1/3 de férias). No mês de retorno, você só recebe
                  pelos dias efetivamente trabalhados. Por isso o valor é menor
                  que o normal.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Quando recebo o salário das férias?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Por lei, o pagamento das férias (salário + 1/3) deve ser feito
                  até 2 dias antes do início do período de férias. Esse valor já
                  inclui o pagamento pelos dias que você estará de férias.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Como me preparar financeiramente?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Reserve parte do adiantamento de férias para cobrir o mês de
                  retorno. Por exemplo, se você tirar 30 dias e voltar no dia
                  15, guarde cerca de 50% do adiantamento. Assim você não fica
                  no vermelho no mês seguinte.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Posso vender parte das férias?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Sim! Você pode "vender" até 1/3 das férias (10 dias). Isso é
                  chamado de abono pecuniário. Nesse caso, você trabalha esses
                  dias e recebe o valor correspondente, amenizando o impacto no
                  mês de retorno.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
