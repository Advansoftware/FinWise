// src/app/(marketing)/calculadoras/rescisao/severance-calculator.tsx

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Briefcase,
  Calculator,
  Info,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type TerminationType =
  | "sem_justa_causa"
  | "pedido_demissao"
  | "acordo"
  | "justa_causa";

const terminationLabels: Record<TerminationType, string> = {
  sem_justa_causa: "Demissão Sem Justa Causa",
  pedido_demissao: "Pedido de Demissão",
  acordo: "Acordo (Reforma Trabalhista)",
  justa_causa: "Demissão por Justa Causa",
};

export function PublicSeveranceCalculator() {
  const theme = useTheme();
  const [grossSalary, setGrossSalary] = useState<string>("");
  const [fgtsBalance, setFgtsBalance] = useState<string>("");
  const [monthsWorked, setMonthsWorked] = useState<number>(12);
  const [vacationMonths, setVacationMonths] = useState<number>(6);
  const [noticePeriodWorked, setNoticePeriodWorked] = useState<boolean>(false);
  const [terminationType, setTerminationType] =
    useState<TerminationType>("sem_justa_causa");
  const [result, setResult] = useState<{
    salaryBalance: number;
    vacationProportional: number;
    vacationOneThird: number;
    thirteenthProportional: number;
    noticePeriod: number;
    fgtsMulta: number;
    grossTotal: number;
    netTotal: number;
  } | null>(null);

  const handleCalculate = () => {
    const salary = parseFloat(
      grossSalary.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const fgts = parseFloat(
      fgtsBalance.replace(/[^\d,]/g, "").replace(",", ".") || "0"
    );
    if (!salary || salary <= 0) return;

    // Saldo de salário (proporcional aos dias trabalhados no mês - assumindo 15 dias)
    const salaryBalance = salary / 2;

    // Férias proporcionais + 1/3
    const vacationProportional = (salary / 12) * vacationMonths;
    const vacationOneThird = vacationProportional / 3;

    // 13º proporcional
    const thirteenthProportional = (salary / 12) * monthsWorked;

    // Aviso prévio
    let noticePeriod = 0;
    if (terminationType === "sem_justa_causa" || terminationType === "acordo") {
      // 30 dias + 3 dias por ano trabalhado (máximo 90 dias)
      const yearsWorked = Math.floor(monthsWorked / 12);
      const noticeDays = Math.min(30 + yearsWorked * 3, 90);
      noticePeriod = noticePeriodWorked ? 0 : (salary / 30) * noticeDays;

      // Acordo: metade do aviso prévio
      if (terminationType === "acordo") {
        noticePeriod = noticePeriod / 2;
      }
    }

    // Multa FGTS
    let fgtsMulta = 0;
    if (terminationType === "sem_justa_causa") {
      fgtsMulta = fgts * 0.4; // 40%
    } else if (terminationType === "acordo") {
      fgtsMulta = fgts * 0.2; // 20%
    }

    // Total bruto
    let grossTotal =
      salaryBalance +
      vacationProportional +
      vacationOneThird +
      thirteenthProportional +
      noticePeriod;

    // Justa causa: só recebe saldo de salário e férias vencidas
    if (terminationType === "justa_causa") {
      grossTotal = salaryBalance;
    }

    // Pedido de demissão: sem multa FGTS e sem aviso prévio (a menos que trabalhe)
    if (terminationType === "pedido_demissao") {
      // Desconta aviso prévio se não trabalhou
      if (!noticePeriodWorked) {
        grossTotal -= salary; // Desconto do aviso
      }
    }

    const netTotal = grossTotal + fgtsMulta;

    setResult({
      salaryBalance,
      vacationProportional,
      vacationOneThird,
      thirteenthProportional,
      noticePeriod,
      fgtsMulta,
      grossTotal,
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

  const handleFgtsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value) {
      const formatted = (parseInt(value) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setFgtsBalance(formatted);
    } else {
      setFgtsBalance("");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            "#ff9800",
            0.1
          )} 0%, ${alpha("#ff9800", 0.05)} 100%)`,
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
                  bgcolor: alpha("#ff9800", 0.1),
                  color: "#ff9800",
                }}
              >
                <Briefcase size={28} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Calculadora de Rescisão
                </Typography>
                <Typography color="text.secondary">
                  Simule todos os valores da sua rescisão trabalhista
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

                  <FormControl fullWidth>
                    <InputLabel>Tipo de Rescisão</InputLabel>
                    <Select
                      value={terminationType}
                      label="Tipo de Rescisão"
                      onChange={(e: SelectChangeEvent) =>
                        setTerminationType(e.target.value as TerminationType)
                      }
                    >
                      {Object.entries(terminationLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

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
                  />

                  <TextField
                    label="Saldo do FGTS"
                    value={fgtsBalance}
                    onChange={handleFgtsChange}
                    placeholder="0,00"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                    helperText="Para calcular a multa de 40% ou 20%"
                  />

                  <TextField
                    label="Meses Trabalhados no Ano"
                    type="number"
                    value={monthsWorked}
                    onChange={(e) =>
                      setMonthsWorked(
                        Math.max(1, Math.min(12, parseInt(e.target.value) || 1))
                      )
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 12 }}
                    helperText="Para cálculo do 13º proporcional"
                  />

                  <TextField
                    label="Meses de Férias Proporcionais"
                    type="number"
                    value={vacationMonths}
                    onChange={(e) =>
                      setVacationMonths(
                        Math.max(0, Math.min(12, parseInt(e.target.value) || 0))
                      )
                    }
                    fullWidth
                    inputProps={{ min: 0, max: 12 }}
                    helperText="Meses desde as últimas férias"
                  />

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCalculate}
                    startIcon={<Calculator size={20} />}
                    fullWidth
                    sx={{
                      bgcolor: "#ff9800",
                      "&:hover": { bgcolor: "#f57c00" },
                    }}
                  >
                    Calcular Rescisão
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {terminationType === "justa_causa" && (
              <Alert
                severity="warning"
                sx={{ mt: 2 }}
                icon={<AlertTriangle size={20} />}
              >
                Na demissão por justa causa, o trabalhador perde direito a aviso
                prévio, 13º proporcional, férias proporcionais e multa do FGTS.
              </Alert>
            )}
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
                      Valor Estimado da Rescisão
                    </Typography>
                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatCurrency(result.netTotal)}
                    </Typography>
                    <Chip
                      label={terminationLabels[terminationType]}
                      size="small"
                      color="warning"
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
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          gutterBottom
                        >
                          Verbas Rescisórias
                        </Typography>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2">
                              Saldo de Salário
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(result.salaryBalance)}
                            </Typography>
                          </Box>

                          {terminationType !== "justa_causa" && (
                            <>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography variant="body2">
                                  Férias Proporcionais
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatCurrency(result.vacationProportional)}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography variant="body2">
                                  1/3 de Férias
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatCurrency(result.vacationOneThird)}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography variant="body2">
                                  13º Proporcional
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatCurrency(
                                    result.thirteenthProportional
                                  )}
                                </Typography>
                              </Box>
                            </>
                          )}

                          {result.noticePeriod > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">
                                Aviso Prévio Indenizado
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {formatCurrency(result.noticePeriod)}
                              </Typography>
                            </Box>
                          )}

                          <Divider />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              Total Verbas
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {formatCurrency(result.grossTotal)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {result.fgtsMulta > 0 && (
                        <Box>
                          <Typography
                            variant="overline"
                            color="text.secondary"
                            gutterBottom
                          >
                            FGTS
                          </Typography>
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2">
                                Multa{" "}
                                {terminationType === "acordo" ? "20%" : "40%"}{" "}
                                FGTS
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                color="success.main"
                              >
                                + {formatCurrency(result.fgtsMulta)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* CTA */}
                <Alert
                  severity="info"
                  icon={<Sparkles size={20} />}
                  sx={{
                    "& .MuiAlert-icon": { color: "primary.main" },
                  }}
                >
                  <Typography variant="body2">
                    <strong>Planeje sua transição!</strong> Com o Gastometria
                    você pode controlar esse dinheiro, criar metas e planejar
                    seus próximos passos.{" "}
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
                <Briefcase
                  size={48}
                  style={{ opacity: 0.3, marginBottom: 16 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Preencha os dados ao lado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecione o tipo de rescisão e informe os valores para
                  calcular.
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
            Perguntas Frequentes sobre Rescisão
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                O que é a multa de 40% do FGTS?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Na demissão sem justa causa, o empregador deve pagar uma multa
                de 40% sobre o saldo total do FGTS do trabalhador depositado
                durante o contrato.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                O que é aviso prévio indenizado?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quando a empresa dispensa o trabalhador imediatamente, deve
                pagar o aviso prévio em dinheiro. O período mínimo é 30 dias,
                mais 3 dias por ano trabalhado (máx 90 dias).
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                O que muda na rescisão por acordo?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Desde a Reforma Trabalhista, é possível fazer acordo: o
                trabalhador recebe metade do aviso prévio, 20% da multa do FGTS
                e pode sacar 80% do saldo do FGTS.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Prazo para pagamento da rescisão?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A empresa tem até 10 dias corridos após o término do contrato
                para pagar todas as verbas rescisórias. O atraso gera multa de
                um salário.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
