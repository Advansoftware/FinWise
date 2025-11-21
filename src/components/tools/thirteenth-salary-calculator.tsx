'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Calculator } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { calculateConsignedImpactOnThirteenth, getConsignedLoanFromPayroll } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";
import { Box, Stack, Typography } from "@mui/material";

interface ThirteenthSalaryCalculatorProps {
  payrollData: PayrollData;
}

export function ThirteenthSalaryCalculator({ payrollData }: ThirteenthSalaryCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
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
  const currentData = mode === 'payroll' ? payrollData : {
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
    
    if (mode === 'payroll') {
      // Para dados do holerite, calcula descontos regulares excluindo consignado
      const regularDiscounts = payrollData.discounts.filter(d => 
        d.type === 'discount' && 
        !d.name.toLowerCase().includes('consignado') &&
        !d.name.toLowerCase().includes('empréstimo') &&
        !d.name.toLowerCase().includes('emprestimo')
      );
      
      const regularDiscountRate = payrollData.grossSalary > 0 
        ? regularDiscounts.reduce((sum, d) => sum + d.amount, 0) / payrollData.grossSalary 
        : 0;
      
      estimatedDiscounts = grossThirteenth * regularDiscountRate;
    } else {
      // Para entrada manual, usa a proporção de desconto baseada na diferença
      const discountRate = currentData.grossSalary > 0 
        ? (currentData.grossSalary - currentData.netSalary) / currentData.grossSalary 
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

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader>
        <Stack direction="row" spacing={1} alignItems="center">
          <TrendingUp style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          <Typography component="span" sx={{ fontSize: '1.125rem' }}>
            <CardTitle>Calculadora do 13º Salário</CardTitle>
          </Typography>
        </Stack>
        <Typography component="span">
          <CardDescription>
            Estime o valor do seu 13º salário baseado no período trabalhado.
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
            <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Dados do Holerite Utilizados no Cálculo:
                </Typography>
                
                {/* Dados salariais */}
                <Stack spacing={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 500 }} color="text.secondary">
                    💰 Dados Salariais:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                    Salário Bruto: <Typography component="span" sx={{ fontWeight: 500 }}>
                      {formatCurrency(payrollData.grossSalary)}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                    Salário Líquido: <Typography component="span" sx={{ fontWeight: 500 }}>
                      {formatCurrency(payrollData.netSalary)}
                    </Typography>
                  </Typography>
                </Stack>

                {/* Descontos regulares */}
                {payrollData.discounts.filter(d => 
                  d.type === 'discount' && 
                  !d.name.toLowerCase().includes('consignado') &&
                  !d.name.toLowerCase().includes('empréstimo') &&
                  !d.name.toLowerCase().includes('emprestimo')
                ).length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ fontWeight: 500 }} color="text.secondary">
                      📊 Descontos Regulares:
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 1 }}>
                      {payrollData.discounts.filter(d => 
                        d.type === 'discount' && 
                        !d.name.toLowerCase().includes('consignado') &&
                        !d.name.toLowerCase().includes('empréstimo') &&
                        !d.name.toLowerCase().includes('emprestimo')
                      ).map((discount, index) => (
                        <Stack key={index} direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">{discount.name}:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {formatCurrency(discount.amount)}
                          </Typography>
                        </Stack>
                      ))}
                      <Typography variant="caption" sx={{ color: 'success.main', mt: 0.5 }}>
                        ✓ Serão aplicados no 13º salário
                      </Typography>
                    </Stack>
                  </Stack>
                )}

                {/* Empréstimo consignado */}
                {payrollData.discounts.filter(d => 
                  d.type === 'discount' && (
                    d.name.toLowerCase().includes('consignado') ||
                    d.name.toLowerCase().includes('empréstimo') ||
                    d.name.toLowerCase().includes('emprestimo')
                  )
                ).length > 0 && (
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ fontWeight: 500 }} color="text.secondary">
                      🏦 Empréstimo Consignado:
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 1 }}>
                      {payrollData.discounts.filter(d => 
                        d.type === 'discount' && (
                          d.name.toLowerCase().includes('consignado') ||
                          d.name.toLowerCase().includes('empréstimo') ||
                          d.name.toLowerCase().includes('emprestimo')
                        )
                      ).map((discount, index) => (
                        <Stack key={index} direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">{discount.name}:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {formatCurrency(discount.amount)}
                          </Typography>
                        </Stack>
                      ))}
                      <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5 }}>
                        ❌ NÃO será descontado do 13º salário
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Box>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Entrada de dados */}
          <Stack spacing={1}>
            <Label htmlFor="monthsWorked">Meses Trabalhados no Ano</Label>
            <Input
              id="monthsWorked"
              type="number"
              min="1"
              max="12"
              value={monthsWorked}
              onChange={(e) => setMonthsWorked(parseInt(e.target.value) || 12)}
              placeholder="12"
            />
            <Typography variant="caption" color="text.secondary">
              Máximo: 12 meses (ano completo)
            </Typography>
          </Stack>

          <Button 
            onClick={calculateThirteenth} 
            sx={{ width: '100%' }}
            disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                     (mode === 'payroll' && !hasPayrollData)}
          >
            <Calculator style={{ width: 16, height: 16, marginRight: 8 }} />
            Calcular 13º Salário
          </Button>

          {/* Resultado */}
          {result && (
            <Stack spacing={1.5} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Resultado do Cálculo:
              </Typography>
              
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">13º Salário Bruto ({monthsWorked}/12):</Typography>
                  <Badge variant="outline">{formatCurrency(result.grossThirteenth)}</Badge>
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Descontos Estimados:</Typography>
                  <Badge variant="outline" sx={{ color: 'error.main' }}>
                    -{formatCurrency(result.estimatedDiscounts)}
                  </Badge>
                </Stack>
                
                {/* Informação específica sobre empréstimo consignado */}
                {result.consignedImpact && mode === 'payroll' && (
                  <Box sx={{ bgcolor: 'info.light', p: 1.5, borderRadius: 1, border: 1, borderColor: 'info.main' }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: 'info.dark', display: 'block', mb: 0.5 }}>
                      💡 Empréstimo Consignado no 13º Salário
                    </Typography>
                    <Stack spacing={0.5} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      <Typography variant="caption">
                        Limite máximo: {formatCurrency(result.consignedImpact.maxAllowedOnThirteenth)} (35% do 13º)
                      </Typography>
                      <Typography variant="caption">
                        Valor aplicado: {formatCurrency(result.consignedImpact.applicableAmount)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: result.consignedImpact.isWithinLimit ? 'success.main' : 'warning.main' }}>
                        {result.consignedImpact.explanation}
                      </Typography>
                    </Stack>
                  </Box>
                )}
                
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>13º Líquido Estimado:</Typography>
                  <Badge sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 700 }}>
                    {formatCurrency(result.netThirteenth)}
                  </Badge>
                </Stack>
                
                {/* Divisão em parcelas para empresas que pagam em 2x */}
                <Box sx={{ bgcolor: 'info.light', p: 1.5, borderRadius: 1, border: 1, borderColor: 'info.main', mt: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'info.dark', display: 'block', mb: 1 }}>
                    💡 Para empresas que pagam em 2 parcelas:
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">1ª Parcela (até 30/nov) - Sem descontos:</Typography>
                      <Badge variant="outline" sx={{ color: 'success.main' }}>
                        {formatCurrency(result.grossThirteenth / 2)}
                      </Badge>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">2ª Parcela (até 20/dez) - Com descontos:</Typography>
                      <Badge variant="outline" sx={{ color: 'info.dark' }}>
                        {formatCurrency((result.grossThirteenth / 2) - result.estimatedDiscounts)}
                      </Badge>
                    </Stack>
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'background.paper', p: 1, borderRadius: 1, mt: 1 }}>
                      <Typography variant="caption" component="div">• 1ª parcela: Metade do valor bruto, sem descontos</Typography>
                      <Typography variant="caption" component="div">• 2ª parcela: Metade do valor bruto menos todos os descontos</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <strong>Total Líquido:</strong> {formatCurrency(result.netThirteenth)}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'info.light', p: 1, borderRadius: 1, border: 1, borderColor: 'info.main' }}>
                <strong>Nota:</strong> {mode === 'payroll' 
                  ? 'Os descontos são estimados baseados na proporção do seu holerite atual. Valores reais podem variar conforme faixas do INSS e IR.'
                  : 'Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos, use os dados do holerite.'
                }
              </Box>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}