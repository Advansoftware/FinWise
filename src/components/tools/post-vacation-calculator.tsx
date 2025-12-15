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
  CalendarDays,
  Calculator,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { getConsignedLoanFromPayroll } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface PostVacationCalculatorProps {
  payrollData: PayrollData;
}

export function PostVacationCalculator({
  payrollData,
}: PostVacationCalculatorProps) {
  const [mode, setMode] = useState<"payroll" | "manual">("payroll");
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [vacationDays, setVacationDays] = useState(30);
  const [result, setResult] = useState<{
    normalSalary: number;
    vacationValue: number;
    vacationDiscount: number;
    daysWorkedAfterVacation: number;
    proportionalSalary: number;
    detailedDiscounts: {
      inss: number;
      ir: number;
      otherDiscounts: { name: string; amount: number }[];
    };
    consignedDiscount: number;
    grossPayroll: number;
    totalDiscounts: number;
    netPayroll: number;
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

  const calculatePostVacation = () => {
    // Salário base mensal
    const normalSalary = currentData.grossSalary;

    // Valor das férias que foi recebido antecipadamente (só para informação)
    const dailySalary = normalSalary / 30;
    const vacationSalary = dailySalary * vacationDays;
    const oneThirdBonus = vacationSalary / 3;
    const vacationValue = vacationSalary + oneThirdBonus;

    // ✅ LÓGICA CORRETA: No mês pós-férias
    // 1. Você recebe o salário normal (30 dias)
    // 2. É descontado apenas os dias que você NÃO trabalhou (férias)
    // 3. Resultado = dias trabalhados no mês

    const daysNotWorked = vacationDays; // Dias de férias = dias não trabalhados
    const daysWorked = 30 - daysNotWorked; // Dias efetivamente trabalhados

    // Desconto dos dias não trabalhados
    const discountForDaysNotWorked = (normalSalary / 30) * daysNotWorked;

    // Valor bruto do holerite = salário normal - dias não trabalhados
    const grossPayroll = normalSalary - discountForDaysNotWorked;

    // Cálculo dos descontos proporcionais aos dias trabalhados
    let detailedDiscounts = {
      inss: 0,
      ir: 0,
      otherDiscounts: [] as { name: string; amount: number }[],
    };
    let consignedDiscount = 0;

    if (mode === "payroll") {
      const workProportion = daysWorked / 30; // Proporção dos dias trabalhados

      // Buscar descontos específicos na lista de descontos
      const inssDiscount = payrollData.discounts.find(
        (d) => d.type === "discount" && d.name.toLowerCase().includes("inss")
      );
      const irDiscount = payrollData.discounts.find(
        (d) =>
          d.type === "discount" &&
          (d.name.toLowerCase().includes("imposto") ||
            d.name.toLowerCase().includes("renda"))
      );

      // INSS proporcional
      detailedDiscounts.inss = (inssDiscount?.amount || 0) * workProportion;

      // IR proporcional
      detailedDiscounts.ir = (irDiscount?.amount || 0) * workProportion;

      // Outros descontos proporcionais (exceto INSS, IR e empréstimo consignado)
      const otherDiscountsList = payrollData.discounts
        .filter(
          (d) =>
            d.type === "discount" &&
            !d.name.toLowerCase().includes("inss") &&
            !d.name.toLowerCase().includes("imposto") &&
            !d.name.toLowerCase().includes("renda") &&
            !d.name.toLowerCase().includes("consignado") &&
            !d.name.toLowerCase().includes("empréstimo") &&
            !d.name.toLowerCase().includes("emprestimo")
        )
        .map((d) => ({ name: d.name, amount: d.amount * workProportion }));

      detailedDiscounts.otherDiscounts = otherDiscountsList;

      // Empréstimo consignado (valor fixo, independente das férias)
      consignedDiscount = getConsignedLoanFromPayroll(payrollData);
    } else {
      // Para entrada manual
      const discountRate =
        currentData.grossSalary > 0
          ? (currentData.grossSalary - currentData.netSalary) /
            currentData.grossSalary
          : 0;
      const totalManualDiscounts = grossPayroll * discountRate;
      // Estimar proporções para entrada manual
      detailedDiscounts.inss = totalManualDiscounts * 0.4; // ~40% geralmente é INSS
      detailedDiscounts.ir = totalManualDiscounts * 0.3; // ~30% geralmente é IR
      detailedDiscounts.otherDiscounts = [
        {
          name: "Outros Descontos Estimados",
          amount: totalManualDiscounts * 0.3,
        },
      ];
    }

    const normalDiscountsTotal =
      detailedDiscounts.inss +
      detailedDiscounts.ir +
      detailedDiscounts.otherDiscounts.reduce(
        (sum, discount) => sum + discount.amount,
        0
      );
    const totalDiscounts = normalDiscountsTotal + consignedDiscount;
    const netPayroll = grossPayroll - totalDiscounts;

    setResult({
      normalSalary,
      vacationValue,
      vacationDiscount: discountForDaysNotWorked,
      daysWorkedAfterVacation: daysWorked,
      proportionalSalary: grossPayroll,
      detailedDiscounts,
      consignedDiscount,
      grossPayroll,
      totalDiscounts,
      netPayroll,
    });
  };

  const theme = useTheme();

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarDays
              style={{
                width: "1.25rem",
                height: "1.25rem",
                color: theme.palette.primary.main,
              }}
            />
            Calculadora Pós-Férias
          </Box>
        }
        subheader="Calcule como ficará seu salário no mês de retorno das férias (5º dia útil)."
        titleTypographyProps={{ variant: "h6" }}
      />
      <CardContent>
        <Stack spacing={3}>
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
                <Info size={16} /> Dados do Holerite Utilizados:
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
                        ✓ Valor fixo mensal (não afetado pelas férias)
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Parâmetros das férias */}
          <Box>
            <TextField
              label="Dias de Férias Tirados"
              type="text"
              value={vacationDays}
              onChange={(e) => setVacationDays(parseInt(e.target.value) || 30)}
              placeholder="30"
              helperText="Dias que você não trabalhou no mês (máximo: 30)"
              InputProps={{ inputProps: { min: 1, max: 30 } }}
              fullWidth
            />
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={calculatePostVacation}
            disabled={
              (mode === "manual" &&
                (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) ||
              (mode === "payroll" && !hasPayrollData)
            }
            startIcon={<Calculator />}
            fullWidth
          >
            Calcular Salário Pós-Férias
          </Button>

          {/* Resultado */}
          {result && (
            <Stack
              spacing={3}
              sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Typography variant="subtitle2">
                Simulação do Holerite Pós-Férias:
              </Typography>

              <Stack spacing={3}>
                {/* Valores base */}
                <Paper
                  variant="outlined"
                  sx={{ p: 2, bgcolor: "background.paper" }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="bold"
                    sx={{ mb: 2, display: "block" }}
                  >
                    📋 Composição do Holerite:
                  </Typography>

                  <Stack spacing={1}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Salário normal (30 dias):
                      </Typography>
                      <Chip
                        label={formatCurrency(result.normalSalary)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Desconto pelos {vacationDays} dias não trabalhados:
                      </Typography>
                      <Chip
                        label={`-${formatCurrency(result.vacationDiscount)}`}
                        size="small"
                        variant="outlined"
                        color="error"
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" fontWeight="medium">
                        Valor pelos {result.daysWorkedAfterVacation} dias
                        trabalhados:
                      </Typography>
                      <Chip
                        label={formatCurrency(result.grossPayroll)}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: "bold" }}
                      />
                    </Box>
                  </Stack>
                </Paper>

                {/* Descontos */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderColor: alpha(theme.palette.error.main, 0.2),
                  }}
                >
                  <Typography
                    variant="caption"
                    color="error.main"
                    fontWeight="bold"
                    sx={{ mb: 2, display: "block" }}
                  >
                    💸 Descontos Aplicados (Proporcionais):
                  </Typography>

                  <Stack spacing={1}>
                    {result.detailedDiscounts.inss > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          INSS:
                        </Typography>
                        <Chip
                          label={`-${formatCurrency(
                            result.detailedDiscounts.inss
                          )}`}
                          size="small"
                          variant="outlined"
                          color="error"
                        />
                      </Box>
                    )}

                    {result.detailedDiscounts.ir > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Imposto de Renda:
                        </Typography>
                        <Chip
                          label={`-${formatCurrency(
                            result.detailedDiscounts.ir
                          )}`}
                          size="small"
                          variant="outlined"
                          color="error"
                        />
                      </Box>
                    )}

                    {result.detailedDiscounts.otherDiscounts.map(
                      (discount, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {discount.name}:
                          </Typography>
                          <Chip
                            label={`-${formatCurrency(discount.amount)}`}
                            size="small"
                            variant="outlined"
                            color="error"
                          />
                        </Box>
                      )
                    )}

                    {result.consignedDiscount > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Empréstimo consignado (valor fixo):
                          </Typography>
                          <Chip
                            label={`-${formatCurrency(
                              result.consignedDiscount
                            )}`}
                            size="small"
                            variant="outlined"
                            color="error"
                          />
                        </Box>
                      </>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" fontWeight="medium">
                        Total dos descontos:
                      </Typography>
                      <Chip
                        label={`-${formatCurrency(result.totalDiscounts)}`}
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ fontWeight: "bold" }}
                      />
                    </Box>
                  </Stack>
                </Paper>

                {/* Resultado final */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pt: 1,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle2">
                    Salário Líquido Pós-Férias:
                  </Typography>
                  <Chip
                    label={formatCurrency(result.netPayroll)}
                    color={result.netPayroll >= 0 ? "success" : "error"}
                    sx={{ fontWeight: "bold" }}
                  />
                </Box>

                {/* Informações importantes */}
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
                    color="info.main"
                    fontWeight="bold"
                    sx={{ mb: 1, display: "block" }}
                  >
                    💡 Como Funciona o Cálculo:
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      • Você recebe o salário normal de 30 dias:{" "}
                      {formatCurrency(result.normalSalary)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • É descontado apenas os {vacationDays} dias que NÃO
                      trabalhou: -{formatCurrency(result.vacationDiscount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Sobram os {result.daysWorkedAfterVacation} dias que você
                      trabalhou: {formatCurrency(result.grossPayroll)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Descontos são aplicados proporcionalmente aos dias
                      trabalhados
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Empréstimo consignado continua o valor fixo do holerite
                    </Typography>
                    {result.netPayroll >= 0 ? (
                      <Typography
                        variant="caption"
                        color="success.main"
                        fontWeight="medium"
                        sx={{ mt: 1, display: "block" }}
                      >
                        ✅ Resultado positivo: você receberá{" "}
                        {formatCurrency(result.netPayroll)}
                      </Typography>
                    ) : (
                      <Typography
                        variant="caption"
                        color="error.main"
                        fontWeight="medium"
                        sx={{ mt: 1, display: "block" }}
                      >
                        ⚠️ Resultado negativo: você deve{" "}
                        {formatCurrency(Math.abs(result.netPayroll))} para a
                        empresa
                      </Typography>
                    )}
                  </Stack>
                </Paper>
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
                    ? `Cálculo baseado na lógica correta: você recebe apenas pelos dias trabalhados no mês. Descontos (INSS, IR, etc.) são calculados proporcionalmente baseados nos valores do seu holerite. Empréstimo consignado mantém valor fixo.`
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
