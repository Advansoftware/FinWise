"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Divider,
  Box,
  Stack,
  Paper,
  Chip,
  useTheme,
  alpha,
  InputAdornment,
  Grid,
} from "@mui/material";
import {
  Plane,
  Calculator,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  calculateConsignedImpactOnVacation,
  getConsignedLoanFromPayroll,
  calculateINSSFromSalary,
  calculateIRFromSalary,
} from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface VacationCalculatorProps {
  payrollData: PayrollData;
}

export function VacationCalculator({ payrollData }: VacationCalculatorProps) {
  const [mode, setMode] = useState<"payroll" | "manual">("payroll");
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [vacationDays, setVacationDays] = useState(30);
  const [result, setResult] = useState<{
    vacationSalary: number;
    oneThirdBonus: number;
    grossTotal: number;
    detailedDiscounts: {
      inss: number;
      ir: number;
      otherDiscounts: number;
      consigned: number;
    };
    consignedImpact: {
      maxAllowedOnVacation: number;
      applicableAmount: number;
      availableRemuneration?: number;
      isWithinLimit: boolean;
      explanation: string;
    } | null;
    estimatedDiscounts: number;
    netTotal: number;
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

  const calculateVacation = () => {
    // Cálculo baseado no salário bruto
    const dailySalary = currentData.grossSalary / 30;
    const vacationSalary = dailySalary * vacationDays;
    const oneThirdBonus = vacationSalary / 3; // 1/3 constitucional
    const grossTotal = vacationSalary + oneThirdBonus;

    // Calcula descontos detalhados baseado no modo
    let detailedDiscounts = {
      inss: 0,
      ir: 0,
      otherDiscounts: 0,
      consigned: 0,
    };

    if (mode === "payroll") {
      // Extrai valores específicos do holerite
      const inssFromPayroll =
        payrollData.discounts.find((d) => d.name.toLowerCase().includes("inss"))
          ?.amount || 0;

      const irFromPayroll =
        payrollData.discounts.find(
          (d) =>
            d.name.toLowerCase().includes("imposto") ||
            d.name.toLowerCase().includes("ir") ||
            d.name.toLowerCase().includes("renda")
        )?.amount || 0;

      // Calcula INSS proporcional: se R$ 556,20 é para 30 dias, para 15 dias seria metade
      const vacationProportion = vacationDays / 30;
      detailedDiscounts.inss = inssFromPayroll * vacationProportion;

      // Calcula IR proporcional: baseado na proporção das férias
      detailedDiscounts.ir = irFromPayroll * vacationProportion;

      // Outros descontos (proporcionais aos do holerite, excluindo INSS, IR e consignado)
      const otherDiscountsFromPayroll = payrollData.discounts.filter(
        (d) =>
          d.type === "discount" &&
          !d.name.toLowerCase().includes("inss") &&
          !d.name.toLowerCase().includes("imposto") &&
          !d.name.toLowerCase().includes("ir") &&
          !d.name.toLowerCase().includes("renda") &&
          !d.name.toLowerCase().includes("consignado") &&
          !d.name.toLowerCase().includes("empréstimo") &&
          !d.name.toLowerCase().includes("emprestimo")
      );

      const otherDiscountsTotal = otherDiscountsFromPayroll.reduce(
        (sum, d) => sum + d.amount,
        0
      );
      detailedDiscounts.otherDiscounts =
        otherDiscountsTotal * vacationProportion;

      // Empréstimo consignado (valor fixo do holerite, respeitando limite de 35% da remuneração disponível)
      const consignedAmount = getConsignedLoanFromPayroll(payrollData);
      if (consignedAmount > 0) {
        // Calcula a remuneração disponível = valor bruto - descontos obrigatórios (INSS + IR)
        const availableRemuneration =
          grossTotal - detailedDiscounts.inss - detailedDiscounts.ir;

        // Limite de 35% sobre a remuneração disponível (após descontos obrigatórios)
        const maxAllowedOnVacation = availableRemuneration * 0.35;
        const applicableAmount = Math.min(
          consignedAmount,
          maxAllowedOnVacation
        );

        detailedDiscounts.consigned = applicableAmount;

        // Cria o objeto consignedImpact com os valores corretos das férias
        const consignedImpact = {
          maxAllowedOnVacation,
          applicableAmount,
          availableRemuneration,
          isWithinLimit: consignedAmount <= maxAllowedOnVacation,
          explanation:
            consignedAmount > maxAllowedOnVacation
              ? `Valor excede o limite de 35% da remuneração disponível das férias de ${vacationDays} dias. Aplicando apenas R$ ${applicableAmount.toFixed(
                  2
                )}`
              : `Valor dentro do limite de 35% da remuneração disponível das férias de ${vacationDays} dias`,
        };
      } else {
        detailedDiscounts.consigned = 0;
      }
    } else {
      // Para entrada manual, usa a proporção de desconto baseada na diferença
      const discountRate =
        currentData.grossSalary > 0
          ? (currentData.grossSalary - currentData.netSalary) /
            currentData.grossSalary
          : 0;
      const totalEstimatedDiscount = grossTotal * discountRate;

      // Distribui proporcionalmente (estimativa)
      detailedDiscounts.inss = totalEstimatedDiscount * 0.4; // ~40% do desconto
      detailedDiscounts.ir = totalEstimatedDiscount * 0.3; // ~30% do desconto
      detailedDiscounts.otherDiscounts = totalEstimatedDiscount * 0.3; // ~30% do desconto
    }

    const estimatedDiscounts =
      detailedDiscounts.inss +
      detailedDiscounts.ir +
      detailedDiscounts.otherDiscounts +
      detailedDiscounts.consigned;
    const netTotal = grossTotal - estimatedDiscounts;

    // Para o modo payroll, o consignedImpact já foi calculado acima
    // Para modo manual, não há empréstimo consignado
    let finalConsignedImpact = null;
    if (mode === "payroll") {
      const consignedAmount = getConsignedLoanFromPayroll(payrollData);
      if (consignedAmount > 0) {
        // Calcula a remuneração disponível = valor bruto - descontos obrigatórios (INSS + IR)
        const availableRemuneration =
          grossTotal - detailedDiscounts.inss - detailedDiscounts.ir;

        // Limite de 35% sobre a remuneração disponível (após descontos obrigatórios)
        const maxAllowedOnVacation = availableRemuneration * 0.35;
        const applicableAmount = Math.min(
          consignedAmount,
          maxAllowedOnVacation
        );

        finalConsignedImpact = {
          maxAllowedOnVacation,
          applicableAmount,
          availableRemuneration,
          isWithinLimit: consignedAmount <= maxAllowedOnVacation,
          explanation:
            consignedAmount > maxAllowedOnVacation
              ? `Valor excede o limite de 35% da remuneração disponível das férias de ${vacationDays} dias. Aplicando apenas R$ ${applicableAmount.toFixed(
                  2
                )}`
              : `Valor dentro do limite de 35% da remuneração disponível das férias de ${vacationDays} dias`,
        };
      }
    }

    setResult({
      vacationSalary,
      oneThirdBonus,
      grossTotal,
      detailedDiscounts,
      consignedImpact: finalConsignedImpact,
      estimatedDiscounts,
      netTotal,
    });
  };

  const theme = useTheme();

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Plane
              style={{
                width: "1.25rem",
                height: "1.25rem",
                color: theme.palette.primary.main,
              }}
            />
            Calculadora de Férias
          </Box>
        }
        subheader="Calcule o valor das suas férias baseado no seu salário atual."
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
              <Typography
                variant="subtitle2"
                color="info.main"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Info size={16} /> Dados do Holerite Utilizados no Cálculo:
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="info.dark"
                    fontWeight="bold"
                  >
                    💰 Dados Salariais:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography
                      variant="caption"
                      display="block"
                      color="info.dark"
                    >
                      Salário Bruto:{" "}
                      <Box component="span" fontWeight="medium">
                        {formatCurrency(payrollData.grossSalary)}
                      </Box>
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="info.dark"
                    >
                      Salário Líquido:{" "}
                      <Box component="span" fontWeight="medium">
                        {formatCurrency(payrollData.netSalary)}
                      </Box>
                    </Typography>
                  </Box>
                </Box>

                {/* Descontos regulares */}
                {payrollData.discounts.filter(
                  (d) =>
                    d.type === "discount" &&
                    !d.name.toLowerCase().includes("consignado") &&
                    !d.name.toLowerCase().includes("empréstimo") &&
                    !d.name.toLowerCase().includes("emprestimo")
                ).length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="info.dark"
                      fontWeight="bold"
                    >
                      📊 Descontos Regulares:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {payrollData.discounts
                        .filter(
                          (d) =>
                            d.type === "discount" &&
                            !d.name.toLowerCase().includes("consignado") &&
                            !d.name.toLowerCase().includes("empréstimo") &&
                            !d.name.toLowerCase().includes("emprestimo")
                        )
                        .map((discount, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption" color="info.dark">
                              {discount.name}:
                            </Typography>
                            <Typography
                              variant="caption"
                              fontWeight="medium"
                              color="info.dark"
                            >
                              {formatCurrency(discount.amount)}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  </Box>
                )}

                {/* Empréstimo consignado */}
                {payrollData.discounts.filter(
                  (d) =>
                    d.type === "discount" &&
                    (d.name.toLowerCase().includes("consignado") ||
                      d.name.toLowerCase().includes("empréstimo") ||
                      d.name.toLowerCase().includes("emprestimo"))
                ).length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="info.dark"
                      fontWeight="bold"
                    >
                      🏦 Empréstimo Consignado:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {payrollData.discounts
                        .filter(
                          (d) =>
                            d.type === "discount" &&
                            (d.name.toLowerCase().includes("consignado") ||
                              d.name.toLowerCase().includes("empréstimo") ||
                              d.name.toLowerCase().includes("emprestimo"))
                        )
                        .map((discount, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption" color="info.dark">
                              {discount.name}:
                            </Typography>
                            <Typography
                              variant="caption"
                              fontWeight="medium"
                              color="info.dark"
                            >
                              {formatCurrency(discount.amount)}
                            </Typography>
                          </Box>
                        ))}
                      <Typography
                        variant="caption"
                        color="info.main"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        ✓ Será aplicado nas férias (limite 35%)
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Entrada de dados */}
          <Box>
            <TextField
              label="Dias de Férias"
              type="text"
              value={vacationDays}
              onChange={(e) => setVacationDays(parseInt(e.target.value) || 30)}
              placeholder="30"
              helperText="Máximo: 30 dias (férias completas)"
              InputProps={{ inputProps: { min: 1, max: 30 } }}
              fullWidth
            />
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={calculateVacation}
            disabled={
              (mode === "manual" &&
                (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) ||
              (mode === "payroll" && !hasPayrollData)
            }
            startIcon={<Calculator />}
            fullWidth
          >
            Calcular Férias
          </Button>

          {/* Resultado */}
          {result && (
            <Stack
              spacing={3}
              sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Typography variant="subtitle2">Resultado do Cálculo:</Typography>

              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2">
                    Valor das férias ({vacationDays} dias):
                  </Typography>
                  <Chip
                    label={formatCurrency(result.vacationSalary)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2">1/3 Constitucional:</Typography>
                  <Chip
                    label={formatCurrency(result.oneThirdBonus)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" fontWeight="medium">
                    Total Bruto:
                  </Typography>
                  <Chip
                    label={formatCurrency(result.grossTotal)}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: "bold" }}
                  />
                </Stack>

                {/* Detalhamento dos descontos */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderColor: alpha(theme.palette.error.main, 0.2),
                  }}
                >
                  <Stack spacing={1}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 500, mb: 1, display: "block" }}
                      color="error.main"
                    >
                      💼 Detalhamento dos Descontos:
                    </Typography>

                    {result.detailedDiscounts.inss > 0 && (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          INSS (proporcional ao holerite):
                        </Typography>
                        <Chip
                          label={`-${formatCurrency(
                            result.detailedDiscounts.inss
                          )}`}
                          size="small"
                          variant="outlined"
                          color="error"
                        />
                      </Stack>
                    )}

                    {result.detailedDiscounts.ir > 0 && (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          IR (proporcional ao holerite):
                        </Typography>
                        <Chip
                          label={`-${formatCurrency(
                            result.detailedDiscounts.ir
                          )}`}
                          size="small"
                          variant="outlined"
                          color="error"
                        />
                      </Stack>
                    )}

                    {result.detailedDiscounts.otherDiscounts > 0 && (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          Outros descontos (proporcionais):
                        </Typography>
                        <Chip
                          label={`-${formatCurrency(
                            result.detailedDiscounts.otherDiscounts
                          )}`}
                          size="small"
                          variant="outlined"
                          color="error"
                        />
                      </Stack>
                    )}

                    {result.detailedDiscounts.consigned > 0 && (
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          Empréstimo consignado (valor fixo):
                        </Typography>
                        <Chip
                          label={`-${formatCurrency(
                            result.detailedDiscounts.consigned
                          )}`}
                          size="small"
                          variant="outlined"
                          color="error"
                        />
                      </Stack>
                    )}

                    <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          Total dos Descontos:
                        </Typography>
                        <Chip
                          label={`-${formatCurrency(
                            result.estimatedDiscounts
                          )}`}
                          size="small"
                          variant="outlined"
                          color="error"
                          sx={{ fontWeight: "bold" }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>

                {/* Informação específica sobre empréstimo consignado */}
                {result.consignedImpact && mode === "payroll" && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      borderColor: alpha(theme.palette.info.main, 0.2),
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        color: "info.dark",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      💡 Empréstimo Consignado nas Férias de {vacationDays} Dias
                    </Typography>
                    <Stack spacing={0.5} sx={{ color: "text.secondary" }}>
                      <Typography variant="caption">
                        Remuneração disponível:{" "}
                        {formatCurrency(
                          result.consignedImpact.availableRemuneration || 0
                        )}{" "}
                        (após INSS e IR)
                      </Typography>
                      <Typography variant="caption">
                        Limite máximo:{" "}
                        {formatCurrency(
                          result.consignedImpact.maxAllowedOnVacation
                        )}{" "}
                        (35% da remuneração disponível)
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
                          fontWeight: "medium",
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
                  <Typography variant="subtitle2">
                    Total Líquido Estimado:
                  </Typography>
                  <Chip
                    label={formatCurrency(result.netTotal)}
                    color="success"
                    sx={{ fontWeight: "bold" }}
                  />
                </Stack>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    borderColor: alpha(theme.palette.info.main, 0.2),
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    <Box component="span" fontWeight="bold">
                      Nota:
                    </Box>{" "}
                    {mode === "payroll"
                      ? `Cálculo baseado nos valores reais do seu holerite. INSS e IR são calculados proporcionalmente aos ${vacationDays} dias de férias. Empréstimo consignado limitado a 35% da remuneração disponível (após descontos obrigatórios), conforme Portaria MTE nº 435/2025.`
                      : "Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos com regras específicas de consignado, use os dados do holerite."}
                  </Typography>
                </Paper>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
