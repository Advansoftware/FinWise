'use client';

import {useState} from 'react';
import {Card, CardContent, CardHeader, Typography, TextField, Button, Box, Stack, Paper, useTheme, alpha, MenuItem, Chip, InputAdornment} from '@mui/material';
import { Calculator, TrendingUp, Info } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface SalaryProjectionCalculatorProps {
  payrollData: PayrollData;
}

export function SalaryProjectionCalculator({ payrollData }: SalaryProjectionCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [increasePercentage, setIncreasePercentage] = useState(5);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [result, setResult] = useState<{
    newGrossSalary: number;
    newNetSalary: number;
    monthlyIncrease: number;
    yearlyIncrease: number;
    totalEarnings: number;
  } | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  const calculateProjection = () => {
    const increaseMultiplier = 1 + (increasePercentage / 100);
    const newGrossSalary = currentData.grossSalary * increaseMultiplier;
    
    // Estima o novo salário líquido mantendo a mesma proporção de descontos
    const discountRate = currentData.grossSalary > 0 
      ? (currentData.grossSalary - currentData.netSalary) / currentData.grossSalary 
      : 0;
    
    const newNetSalary = newGrossSalary * (1 - discountRate);
    const monthlyIncrease = newNetSalary - currentData.netSalary;
    const yearlyIncrease = monthlyIncrease * 12;
    const totalEarnings = newNetSalary * projectionMonths;

    setResult({
      newGrossSalary,
      newNetSalary,
      monthlyIncrease,
      yearlyIncrease,
      totalEarnings,
    });
  };

  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            Projeção Salarial
          </Box>
        }
        subheader="Projete seus ganhos futuros com base em aumentos salariais."
        titleTypographyProps={{ variant: 'h6' }}
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
          {mode === 'payroll' ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.2) }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info size={16} /> Situação Atual:
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: 2,
                  fontSize: '0.75rem'
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Bruto:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(payrollData.grossSalary)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Líquido:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(payrollData.netSalary)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Configurações da projeção */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 2 
          }}>
            <TextField
              select
              label="Aumento (%)"
              value={increasePercentage.toString()}
              onChange={(e) => setIncreasePercentage(parseFloat(e.target.value))}
              fullWidth
              size="small"
            >
              <MenuItem value="3">3% - Ajuste Inflação</MenuItem>
              <MenuItem value="5">5% - Aumento Padrão</MenuItem>
              <MenuItem value="10">10% - Promoção</MenuItem>
              <MenuItem value="15">15% - Mudança de Cargo</MenuItem>
              <MenuItem value="20">20% - Nova Empresa</MenuItem>
              <MenuItem value="25">25% - Especialização</MenuItem>
            </TextField>

            <TextField
              label="Período (meses)"
              type="number"
              value={projectionMonths}
              onChange={(e) => setProjectionMonths(parseInt(e.target.value) || 12)}
              placeholder="12"
              inputProps={{ min: 1, max: 60 }}
              fullWidth
              size="small"
            />
          </Box>

          <Button 
            variant="contained" 
            size="large"
            onClick={calculateProjection} 
            startIcon={<Calculator />}
            fullWidth
            disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                     (mode === 'payroll' && !hasPayrollData)}
          >
            Calcular Projeção
          </Button>

          {/* Resultados */}
          {result && (
            <Stack spacing={2} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2">
                Projeção com {increasePercentage}% de aumento:
              </Typography>
              
              {/* Novos salários */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Paper variant="outlined" sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.1), 
                  p: 1.5, 
                  borderColor: alpha(theme.palette.success.main, 0.2)
                }}>
                  <Typography variant="caption" color="text.secondary">Novo Salário Bruto</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatCurrency(result.newGrossSalary)}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1), 
                  p: 1.5, 
                  borderColor: alpha(theme.palette.info.main, 0.2)
                }}>
                  <Typography variant="caption" color="text.secondary">Novo Salário Líquido</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {formatCurrency(result.newNetSalary)}
                  </Typography>
                </Paper>
              </Box>

              {/* Aumentos */}
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Aumento Mensal:</Typography>
                  <Chip label={`+${formatCurrency(result.monthlyIncrease)}`} size="small" color="success" variant="outlined" />
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Aumento Anual:</Typography>
                  <Chip label={`+${formatCurrency(result.yearlyIncrease)}`} size="small" color="success" variant="outlined" />
                </Stack>
                
                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    Total em {projectionMonths} meses:
                  </Typography>
                  <Chip label={formatCurrency(result.totalEarnings)} color="primary" sx={{ fontWeight: 'bold' }} />
                </Stack>
              </Stack>

              <Paper variant="outlined" sx={{ 
                p: 1, 
                bgcolor: alpha(theme.palette.info.main, 0.1), 
                borderColor: alpha(theme.palette.info.main, 0.2)
              }}>
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" fontWeight="bold">Nota:</Box> {mode === 'payroll' 
                    ? 'Esta é uma projeção estimada baseada nos dados do seu holerite. Os valores reais podem variar conforme mudanças na legislação e faixas de desconto.'
                    : 'Projeção baseada nos dados informados manualmente. Para estimativas mais precisas, use os dados do holerite.'
                  }
                </Typography>
              </Paper>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}