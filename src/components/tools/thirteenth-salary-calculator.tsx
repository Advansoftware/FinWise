"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  Paper,
  useTheme,
  alpha,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import { TrendingUp, Calculator, Info } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  calculateConsignedImpactOnThirteenth,
  getConsignedLoanFromPayroll,
} from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface ThirteenthSalaryCalculatorProps {
  payrollData: PayrollData;
}

export function ThirteenthSalaryCalculator({
  payrollData,
}: ThirteenthSalaryCalculatorProps) {
  const [mode, setMode] = useState<"payroll" | "manual">("payroll");
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [monthsWorked, setMonthsWorked] = useState(12);
  const [result, setResult] = useState<{
    grossThirteenth: number;
    estimatedDiscounts: number;
    consignedImpact: {
      maxAllowedOnThirteenth: number;
      applicableAmount: number;
      isWithinLimit: boolean;
      explanation: string;
    } | null;
    netThirteenth: number;
  } | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData =
    mode === "payroll"
      ? payrollData
      : {
          ...payrollData,
          grossSalary: manualData.grossSalary,
          netSalary: manualData.netSalary,
        };

  const calculateThirteenth = () => {
    // Cálculo proporcional baseado nos meses trabalhados
    const grossThirteenth = (currentData.grossSalary / 12) * monthsWorked;

    // 13º salário NÃO sofre desconto de empréstimo consignado
    // Apenas descontos regulares (INSS, IR, etc.)

    let estimatedDiscounts = 0;

    if (mode === "payroll") {
      // Para dados do holerite, calcula descontos regulares excluindo consignado
      const regularDiscounts = payrollData.discounts.filter(
        (d) =>
          d.type === "discount" &&
          !d.name.toLowerCase().includes("consignado") &&
          !d.name.toLowerCase().includes("empréstimo") &&
          !d.name.toLowerCase().includes("emprestimo")
      );

      const regularDiscountRate =
        payrollData.grossSalary > 0
          ? regularDiscounts.reduce((sum, d) => sum + d.amount, 0) /
            payrollData.grossSalary
          : 0;

      estimatedDiscounts = grossThirteenth * regularDiscountRate;
    } else {
      // Para entrada manual, usa a proporção de desconto baseada na diferença
      const discountRate =
        currentData.grossSalary > 0
          ? (currentData.grossSalary - currentData.netSalary) /
            currentData.grossSalary
          : 0;
      estimatedDiscounts = grossThirteenth * discountRate;
    }

    const netThirteenth = grossThirteenth - estimatedDiscounts;

    setResult({
      grossThirteenth,
      estimatedDiscounts,
      consignedImpact: null, // 13º não tem desconto de consignado
      netThirteenth,
    });
  };

  const theme = useTheme();

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUp
              style={{
                width: "1.25rem",
                height: "1.25rem",
                color: theme.palette.primary.main,
              }}
            />
            Calculadora do 13º Salário
          </Box>
        }
        subheader="Estime o valor do seu 13º salário baseado no período trabalhado."
        titleTypographyProps={{ variant: "h6" }}
      />
      <CardContent>
        <Stack spacing={2}>
          {/* Toggle entre modos */}
          <CalculatorModeToggle
            mode={mode}
            onModeChange={setMode}
            hasPayrollData={hasPayrollData}
          />

          {/* Entrada de dados baseada no modo */}
          {mode === "payroll" ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                borderColor: alpha(theme.palette.info.main, 0.2),
              }}
            >
              <Stack spacing={1.5}>
                <Typography
                  variant="subtitle2"
                  color="info.main"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Info size={16} /> Dados do Holerite Utilizados no Cálculo:
                </Typography>

                {/* Dados salariais */}
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 500 }}
                    color="text.secondary"
                  >
                    💰 Dados Salariais:
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ pl: 1 }}
                  >
                    Salário Bruto:{" "}
                    <Box component="span" fontWeight="medium">
                      {formatCurrency(payrollData.grossSalary)}
                    </Box>
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ pl: 1 }}
                  >
                    Salário Líquido:{" "}
                    <Box component="span" fontWeight="medium">
                      {formatCurrency(payrollData.netSalary)}
                    </Box>
                  </Typography>
                </Stack>

                {/* Descontos regulares */}
                {payrollData.discounts.filter(
                  (d) =>
                    d.type === "discount" &&
                    !d.name.toLowerCase().includes("consignado") &&
                    !d.name.toLowerCase().includes("empréstimo") &&
                    !d.name.toLowerCase().includes("emprestimo")
                ).length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 500 }}
                      color="text.secondary"
                    >
                      📊 Descontos Regulares:
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 1 }}>
                      {payrollData.discounts
                        .filter(
                          (d) =>
                            d.type === "discount" &&
                            !d.name.toLowerCase().includes("consignado") &&
                            !d.name.toLowerCase().includes("empréstimo") &&
                            !d.name.toLowerCase().includes("emprestimo")
                        )
                        .map((discount, index) => (
                          <Stack
                            key={index}
                            direction="row"
                            justifyContent="space-between"
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {discount.name}:
                            </Typography>
                            <Typography variant="caption" fontWeight="medium">
                              {formatCurrency(discount.amount)}
                            </Typography>
                          </Stack>
                        ))}
                      <Typography
                        variant="caption"
                        sx={{ color: "success.main", mt: 0.5 }}
                      >
                        ✓ Serão aplicados no 13º salário
                      </Typography>
                    </Stack>
                  </Stack>
                )}

                {/* Empréstimo consignado */}
                {payrollData.discounts.filter(
                  (d) =>
                    d.type === "discount" &&
                    (d.name.toLowerCase().includes("consignado") ||
                      d.name.toLowerCase().includes("empréstimo") ||
                      d.name.toLowerCase().includes("emprestimo"))
                ).length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 500 }}
                      color="text.secondary"
                    >
                      🏦 Empréstimo Consignado:
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 1 }}>
                      {payrollData.discounts
                        .filter(
                          (d) =>
                            d.type === "discount" &&
                            (d.name.toLowerCase().includes("consignado") ||
                              d.name.toLowerCase().includes("empréstimo") ||
                              d.name.toLowerCase().includes("emprestimo"))
                        )
                        .map((discount, index) => (
                          <Stack
                            key={index}
                            direction="row"
                            justifyContent="space-between"
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {discount.name}:
                            </Typography>
                            <Typography variant="caption" fontWeight="medium">
                              {formatCurrency(discount.amount)}
                            </Typography>
                          </Stack>
                        ))}
                      <Typography
                        variant="caption"
                        sx={{ color: "error.main", mt: 0.5 }}
                      >
                        ❌ NÃO será descontado do 13º salário
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Paper>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Entrada de dados */}
          <Stack spacing={1}>
            <TextField
              label="Meses Trabalhados no Ano"
              type="text"
              value={monthsWorked}
              onChange={(e) => setMonthsWorked(parseInt(e.target.value) || 12)}
              placeholder="12"
              inputProps={{ min: 1, max: 12 }}
              helperText="Máximo: 12 meses (ano completo)"
              fullWidth
              size="small"
            />
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={calculateThirteenth}
            startIcon={<Calculator />}
            fullWidth
            disabled={
              (mode === "manual" &&
                (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) ||
              (mode === "payroll" && !hasPayrollData)
            }
          >
            Calcular 13º Salário
          </Button>

          {/* Resultado */}
          {result && (
            <Stack
              spacing={1.5}
              sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Typography variant="subtitle2">Resultado do Cálculo:</Typography>

              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2">
                    13º Salário Bruto ({monthsWorked}/12):
                  </Typography>
                  <Chip
                    label={formatCurrency(result.grossThirteenth)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2">Descontos Estimados:</Typography>
                  <Chip
                    label={`-${formatCurrency(result.estimatedDiscounts)}`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Stack>

                {/* Informação específica sobre empréstimo consignado */}
                {result.consignedImpact && mode === "payroll" && (
                  <Paper
                    variant="outlined"
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      p: 1.5,
                      borderColor: alpha(theme.palette.info.main, 0.2),
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "info.main",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      💡 Empréstimo Consignado no 13º Salário
                    </Typography>
                    <Stack
                      spacing={0.5}
                      sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                    >
                      <Typography variant="caption">
                        Limite máximo:{" "}
                        {formatCurrency(
                          result.consignedImpact.maxAllowedOnThirteenth
                        )}{" "}
                        (35% do 13º)
                      </Typography>
                      <Typography variant="caption">
                        Valor aplicado:{" "}
                        {formatCurrency(
                          result.consignedImpact.applicableAmount
                        )}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: result.consignedImpact.isWithinLimit
                            ? "success.main"
                            : "warning.main",
                        }}
                      >
                        {result.consignedImpact.explanation}
                      </Typography>
                    </Stack>
                  </Paper>
                )}

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    13º Líquido Estimado:
                  </Typography>
                  <Chip
                    label={formatCurrency(result.netThirteenth)}
                    color="success"
                    sx={{ fontWeight: "bold" }}
                  />
                </Stack>

                {/* Divisão em parcelas para empresas que pagam em 2x */}
                <Paper
                  variant="outlined"
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    p: 1.5,
                    borderColor: alpha(theme.palette.info.main, 0.2),
                    mt: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "info.main",
                      display: "block",
                      mb: 1,
                    }}
                  >
                    💡 Para empresas que pagam em 2 parcelas:
                  </Typography>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        1ª Parcela (até 30/nov) - Sem descontos:
                      </Typography>
                      <Chip
                        label={formatCurrency(result.grossThirteenth / 2)}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Stack>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        2ª Parcela (até 20/dez) - Com descontos:
                      </Typography>
                      <Chip
                        label={formatCurrency(
                          result.grossThirteenth / 2 - result.estimatedDiscounts
                        )}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Stack>
                    <Paper
                      variant="outlined"
                      sx={{
                        fontSize: "0.75rem",
                        color: "text.secondary",
                        bgcolor: "background.paper",
                        p: 1,
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" component="div">
                        • 1ª parcela: Metade do valor bruto, sem descontos
                      </Typography>
                      <Typography variant="caption" component="div">
                        • 2ª parcela: Metade do valor bruto menos todos os
                        descontos
                      </Typography>
                    </Paper>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="caption"
                    sx={{ display: "block", textAlign: "center" }}
                  >
                    <Box component="span" fontWeight="bold">
                      Total Líquido:
                    </Box>{" "}
                    {formatCurrency(result.netThirteenth)}
                  </Typography>
                </Paper>
              </Stack>

              <Paper
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  p: 1,
                  borderColor: alpha(theme.palette.info.main, 0.2),
                }}
              >
                <Typography variant="caption">
                  <Box component="span" fontWeight="bold">
                    Nota:
                  </Box>{" "}
                  {mode === "payroll"
                    ? "Os descontos são estimados baseados na proporção do seu holerite atual. Valores reais podem variar conforme faixas do INSS e IR."
                    : "Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos, use os dados do holerite."}
                </Typography>
              </Paper>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
