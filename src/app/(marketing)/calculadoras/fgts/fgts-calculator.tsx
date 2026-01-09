// src/app/(marketing)/calculadoras/fgts/fgts-calculator.tsx
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
  PiggyBank,
  Calculator,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Taxa de rendimento do FGTS: 3% ao ano + TR (aproximadamente 0.25% ao mês)
const FGTS_MONTHLY_RATE = 0.003; // ~3.6% ao ano

interface FGTSResult {
  monthlyDeposit: number;
  totalDeposited: number;
  totalWithInterest: number;
  interestEarned: number;
  fine40: number;
  fine20: number;
  totalWithFine40: number;
  totalWithFine20: number;
}

export function FGTSCalculator() {
  const theme = useTheme();
  const [salary, setSalary] = useState<string>("");
  const [months, setMonths] = useState<string>("12");
  const [existingBalance, setExistingBalance] = useState<string>("");
  const [result, setResult] = useState<FGTSResult | null>(null);

  const calculateFGTS = () => {
    const salaryValue = parseFloat(salary.replace(/\D/g, "")) / 100;
    const monthsValue = parseInt(months) || 0;
    const existingBalanceValue =
      parseFloat(existingBalance.replace(/\D/g, "")) / 100 || 0;

    if (salaryValue <= 0) return;

    // Depósito mensal: 8% do salário
    const monthlyDeposit = salaryValue * 0.08;

    // Calcula o saldo com juros compostos
    let balance = existingBalanceValue;
    let totalDeposited = existingBalanceValue;

    for (let i = 0; i < monthsValue; i++) {
      // Adiciona o depósito do mês
      balance += monthlyDeposit;
      totalDeposited += monthlyDeposit;

      // Aplica o rendimento mensal
      balance *= 1 + FGTS_MONTHLY_RATE;
    }

    const interestEarned = balance - totalDeposited;
    const fine40 = balance * 0.4;
    const fine20 = balance * 0.2;

    setResult({
      monthlyDeposit,
      totalDeposited,
      totalWithInterest: balance,
      interestEarned,
      fine40,
      fine20,
      totalWithFine40: balance + fine40,
      totalWithFine20: balance + fine20,
    });
  };

  const handleCurrencyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = (parseInt(value) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setter(value ? formatted : "");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, #9c27b010 100%)`,
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
                bgcolor: alpha("#9c27b0", 0.1),
                color: "#9c27b0",
              }}
            >
              <PiggyBank size={28} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Calculadora de FGTS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Calcule seu saldo, rendimento e multas do FGTS
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCurrencyChange(e, setSalary)
                    }
                    placeholder="0,00"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Saldo Atual do FGTS (opcional)"
                    value={existingBalance}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCurrencyChange(e, setExistingBalance)
                    }
                    placeholder="0,00"
                    fullWidth
                    helperText="Se você já tem saldo, informe aqui"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Período de Trabalho</InputLabel>
                    <Select
                      value={months}
                      label="Período de Trabalho"
                      onChange={(e) => setMonths(e.target.value)}
                    >
                      <MenuItem value="6">6 meses</MenuItem>
                      <MenuItem value="12">1 ano (12 meses)</MenuItem>
                      <MenuItem value="24">2 anos (24 meses)</MenuItem>
                      <MenuItem value="36">3 anos (36 meses)</MenuItem>
                      <MenuItem value="48">4 anos (48 meses)</MenuItem>
                      <MenuItem value="60">5 anos (60 meses)</MenuItem>
                      <MenuItem value="120">10 anos (120 meses)</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={calculateFGTS}
                    startIcon={<Calculator size={20} />}
                    disabled={!salary}
                    fullWidth
                  >
                    Calcular FGTS
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Resultados */}
          <Grid size={{ xs: 12, md: 7 }}>
            {result ? (
              <Stack spacing={3}>
                {/* Depósito Mensal */}
                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Depósito Mensal (8%)
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {formatCurrency(result.monthlyDeposit)}
                        </Typography>
                      </Box>
                      <Wallet size={32} color={theme.palette.primary.main} />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Saldo com Rendimento */}
                <Card
                  sx={{
                    border: 2,
                    borderColor: "success.main",
                    bgcolor: alpha(theme.palette.success.main, 0.05),
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
                            Saldo Total com Rendimento
                          </Typography>
                          <Typography
                            variant="h4"
                            fontWeight={700}
                            color="success.main"
                          >
                            {formatCurrency(result.totalWithInterest)}
                          </Typography>
                        </Box>
                        <TrendingUp
                          size={40}
                          color={theme.palette.success.main}
                        />
                      </Stack>
                      <Divider />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Total Depositado
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(result.totalDeposited)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Rendimento (~3% a.a. + TR)
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight={600}
                            color="success.main"
                          >
                            + {formatCurrency(result.interestEarned)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Multas */}
                <Paper sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Em caso de demissão
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card
                        variant="outlined"
                        sx={{ bgcolor: alpha("#ff9800", 0.05) }}
                      >
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            Demissão Sem Justa Causa
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Multa 40%:{" "}
                            <strong>{formatCurrency(result.fine40)}</strong>
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color="warning.dark"
                          >
                            Total: {formatCurrency(result.totalWithFine40)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card
                        variant="outlined"
                        sx={{ bgcolor: alpha("#2196f3", 0.05) }}
                      >
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            Acordo (Demissão Consensual)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Multa 20%:{" "}
                            <strong>{formatCurrency(result.fine20)}</strong>
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color="info.dark"
                          >
                            Total: {formatCurrency(result.totalWithFine20)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Alerta informativo */}
                <Alert severity="info" icon={<AlertTriangle size={20} />}>
                  <Typography variant="body2">
                    <strong>Importante:</strong> O rendimento do FGTS é de 3% ao
                    ano + Taxa Referencial (TR). Os valores são aproximados e
                    podem variar conforme a TR vigente.
                  </Typography>
                </Alert>

                {/* CTA */}
                <Alert
                  severity="success"
                  icon={<Sparkles size={20} />}
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}
                >
                  <Typography variant="body2">
                    <strong>Dica:</strong> Com o Gastometria você pode controlar
                    todos os seus recebimentos trabalhistas, incluindo FGTS,
                    férias e 13º salário. Tudo integrado com IA para te ajudar a
                    economizar!
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
                  <PiggyBank size={48} color={theme.palette.text.disabled} />
                  <Typography color="text.secondary" textAlign="center">
                    Preencha os dados ao lado para calcular seu FGTS
                  </Typography>
                </Stack>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* FAQ */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Perguntas Frequentes sobre FGTS
          </Typography>
          <Stack spacing={1}>
            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>O que é o FGTS?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  O Fundo de Garantia do Tempo de Serviço (FGTS) é um direito de
                  todo trabalhador com carteira assinada. Todo mês, o empregador
                  deposita 8% do salário bruto do funcionário em uma conta
                  vinculada na Caixa Econômica Federal.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Quando posso sacar o FGTS?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  O FGTS pode ser sacado em diversas situações: demissão sem
                  justa causa, aposentadoria, compra da casa própria, doenças
                  graves, saque-aniversário (se optante), entre outras previstas
                  em lei.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  O que é a multa de 40%?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Quando o trabalhador é demitido sem justa causa, ele tem
                  direito a uma multa de 40% sobre o saldo total do FGTS,
                  incluindo os rendimentos. Esse valor é pago pelo empregador
                  além do saldo já existente.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Como funciona a demissão por acordo?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Na demissão por acordo (também chamada de demissão
                  consensual), o trabalhador recebe 80% do saldo do FGTS e multa
                  de 20% (metade da multa normal). Esta modalidade foi criada
                  pela Reforma Trabalhista de 2017.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight={500}>
                  Qual o rendimento do FGTS?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  O FGTS rende 3% ao ano + Taxa Referencial (TR). É um
                  rendimento inferior à poupança e à inflação, por isso muitas
                  pessoas buscam formas de usar o FGTS para investimentos mais
                  rentáveis, como a compra da casa própria.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
