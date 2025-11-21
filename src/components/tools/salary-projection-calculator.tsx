'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";
import { Box, Stack, Typography } from "@mui/material";

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

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader>
        <Stack direction="row" spacing={1} alignItems="center">
          <TrendingUp style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          <Typography component="span" sx={{ fontSize: '1.125rem' }}>
            <CardTitle>Projeção Salarial</CardTitle>
          </Typography>
        </Stack>
        <Typography component="span">
          <CardDescription>
            Projete seus ganhos futuros com base em aumentos salariais.
          </CardDescription>
        </Typography>
      </CardHeader>
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
            <Box sx={{ 
              bgcolor: 'action.hover', 
              p: 1.5, 
              borderRadius: 1 
            }}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Situação Atual:
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: 2,
                  fontSize: '0.75rem'
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Bruto:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(payrollData.grossSalary)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Líquido:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(payrollData.netSalary)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Configurações da projeção */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 2 
          }}>
            <Stack spacing={1}>
              <Label htmlFor="increasePercentage">Aumento (%)</Label>
              <Select value={increasePercentage.toString()} onValueChange={(value) => setIncreasePercentage(parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3% - Ajuste Inflação</SelectItem>
                  <SelectItem value="5">5% - Aumento Padrão</SelectItem>
                  <SelectItem value="10">10% - Promoção</SelectItem>
                  <SelectItem value="15">15% - Mudança de Cargo</SelectItem>
                  <SelectItem value="20">20% - Nova Empresa</SelectItem>
                  <SelectItem value="25">25% - Especialização</SelectItem>
                </SelectContent>
              </Select>
            </Stack>

            <Stack spacing={1}>
              <Label htmlFor="projectionMonths">Período (meses)</Label>
              <Input
                id="projectionMonths"
                type="number"
                min="1"
                max="60"
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(parseInt(e.target.value) || 12)}
                placeholder="12"
              />
            </Stack>
          </Box>

          <Button 
            onClick={calculateProjection} 
            sx={{ width: '100%' }}
            disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                     (mode === 'payroll' && !hasPayrollData)}
          >
            <Calculator style={{ width: 16, height: 16, marginRight: 8 }} />
            Calcular Projeção
          </Button>

          {/* Resultados */}
          {result && (
            <Stack spacing={2} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Projeção com {increasePercentage}% de aumento:
              </Typography>
              
              {/* Novos salários */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box sx={{ 
                  bgcolor: 'success.light', 
                  p: 1.5, 
                  borderRadius: 1, 
                  border: 1, 
                  borderColor: 'success.main' 
                }}>
                  <Typography variant="body2" color="text.secondary">Novo Salário Bruto</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.dark' }}>
                    {formatCurrency(result.newGrossSalary)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  bgcolor: 'info.light', 
                  p: 1.5, 
                  borderRadius: 1, 
                  border: 1, 
                  borderColor: 'info.main' 
                }}>
                  <Typography variant="body2" color="text.secondary">Novo Salário Líquido</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'info.dark' }}>
                    {formatCurrency(result.newNetSalary)}
                  </Typography>
                </Box>
              </Box>

              {/* Aumentos */}
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Aumento Mensal:</Typography>
                  <Badge sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
                    +{formatCurrency(result.monthlyIncrease)}
                  </Badge>
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Aumento Anual:</Typography>
                  <Badge sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
                    +{formatCurrency(result.yearlyIncrease)}
                  </Badge>
                </Stack>
                
                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Total em {projectionMonths} meses:
                  </Typography>
                  <Badge sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
                    {formatCurrency(result.totalEarnings)}
                  </Badge>
                </Stack>
              </Stack>

              <Box sx={{ 
                fontSize: '0.75rem', 
                color: 'text.secondary', 
                bgcolor: 'info.light', 
                p: 1, 
                borderRadius: 1, 
                border: 1, 
                borderColor: 'info.main' 
              }}>
                <strong>Nota:</strong> {mode === 'payroll' 
                  ? 'Esta é uma projeção estimada baseada nos dados do seu holerite. Os valores reais podem variar conforme mudanças na legislação e faixas de desconto.'
                  : 'Projeção baseada nos dados informados manualmente. Para estimativas mais precisas, use os dados do holerite.'
                }
              </Box>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}