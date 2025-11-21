'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock, DollarSign, Users, AlertCircle, CheckCircle } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { getINSSFromPayroll, calculateINSSFromSalary, validatePayrollData } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";
import { Box, Stack, Typography, Divider } from "@mui/material";

interface INSSCalculatorProps {
  payrollData: PayrollData;
}

interface INSSCalculation {
  monthlyContribution: number;
  yearlyContribution: number;
  contributionRate: number;
  yearsToRetirement: number;
  estimatedBenefit: number;
  totalContributed: number;
}

export function INSSCalculator({ payrollData }: INSSCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [contributionYears, setContributionYears] = useState<number>(5);
  const [calculation, setCalculation] = useState<INSSCalculation | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  // Tabela INSS 2024/2025
  const inssTable = [
    { min: 0, max: 1412.00, rate: 0.075 },
    { min: 1412.01, max: 2666.68, rate: 0.09 },
    { min: 2666.69, max: 4000.03, rate: 0.12 },
    { min: 4000.04, max: 7786.02, rate: 0.14 }
  ];

  const calculateINSS = () => {
    const grossSalary = currentData.grossSalary;
    
    // Usar INSS real do holerite apenas no modo payroll
    const registeredINSS = mode === 'payroll' ? getINSSFromPayroll(payrollData) : 0;
    const calculatedINSS = calculateINSSFromSalary(grossSalary);
    
    // Usar o INSS registrado se disponível (modo payroll), senão o calculado
    const monthlyContribution = registeredINSS || calculatedINSS;
    
    const effectiveRate = grossSalary > 0 ? (monthlyContribution / grossSalary) * 100 : 0;
    const yearlyContribution = monthlyContribution * 12;

    // Regras de aposentadoria (regra de pontos - 2024)
    const minAgeWomen = 62;
    const minAgeMen = 65;
    const minContributionTime = 20; // anos mínimos de contribuição para mulheres
    const minContributionTimeMen = 20; // anos mínimos de contribuição para homens
    
    // Assumindo sexo masculino para cálculo padrão (pode ser parametrizado)
    const retirementAge = minAgeMen;
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const totalContributionYears = contributionYears + yearsToRetirement;

    // Estimativa simplificada do benefício (média dos 80% maiores salários)
    // Fator previdenciário simplificado
    const averageSalary = grossSalary; // Simplificação
    const replacementRate = Math.min(0.6 + (totalContributionYears - minContributionTimeMen) * 0.02, 1);
    const estimatedBenefit = Math.min(averageSalary * replacementRate, 7786.02);

    const totalContributed = monthlyContribution * totalContributionYears * 12;

    setCalculation({
      monthlyContribution,
      yearlyContribution,
      contributionRate: effectiveRate,
      yearsToRetirement,
      estimatedBenefit,
      totalContributed
    });
  };

  useEffect(() => {
    if ((mode === 'payroll' && hasPayrollData) || (mode === 'manual' && manualData.grossSalary > 0)) {
      calculateINSS();
    }
  }, [currentAge, contributionYears, payrollData.grossSalary, mode, manualData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <Stack direction="row" spacing={1} alignItems="center">
          <Shield style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          <Typography component="span" sx={{ fontSize: '1.125rem' }}>
            <CardTitle>Calculadora de INSS</CardTitle>
          </Typography>
        </Stack>
        <Typography component="span">
          <CardDescription>
            Calcule sua contribuição previdenciária e estimativa de aposentadoria
          </CardDescription>
        </Typography>
      </CardHeader>
      <CardContent>
        <Stack spacing={3}>
          {/* Toggle entre modos */}
          <CalculatorModeToggle 
            mode={mode} 
            onModeChange={setMode} 
            hasPayrollData={hasPayrollData}
          />

          {/* Entrada de dados baseada no modo */}
          {mode === 'payroll' ? (
            <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Dados do Holerite:</Typography>
                <Typography variant="caption" color="text.secondary">
                  Salário Bruto: <Typography component="span" sx={{ fontWeight: 500 }}>
                    {formatCurrency(payrollData.grossSalary)}
                  </Typography>
                </Typography>
              </Stack>
            </Box>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Inputs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Stack spacing={1}>
              <Label htmlFor="currentAge">Idade atual</Label>
              <Input
                id="currentAge"
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                min="18"
                max="70"
              />
            </Stack>
            
            <Stack spacing={1}>
              <Label htmlFor="contributionYears">Anos já contribuídos</Label>
              <Input
                id="contributionYears"
                type="number"
                value={contributionYears}
                onChange={(e) => setContributionYears(Number(e.target.value))}
                min="0"
                max="50"
              />
            </Stack>
          </Box>

          <Button onClick={calculateINSS} sx={{ width: '100%' }}>
            <Shield style={{ width: 16, height: 16, marginRight: 8 }} />
            Calcular INSS
          </Button>

          {calculation && (
            <>
                <Divider />
              
              {/* Validação dos dados */}
              {(() => {
                const registeredINSS = getINSSFromPayroll(payrollData);
                const calculatedINSS = calculateINSSFromSalary(payrollData.grossSalary);
                const validation = validatePayrollData(payrollData);
                
                return (
                  <Stack spacing={2}>
                    {registeredINSS > 0 && (
                      <Box sx={{ 
                        bgcolor: Math.abs(registeredINSS - calculatedINSS) <= 10 ? 'success.light' : 'warning.light',
                        p: 2,
                        borderRadius: 1
                      }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          {Math.abs(registeredINSS - calculatedINSS) <= 10 ? (
                            <CheckCircle style={{ width: 16, height: 16, color: 'var(--success)' }} />
                          ) : (
                            <AlertCircle style={{ width: 16, height: 16, color: 'var(--warning)' }} />
                          )}
                          <Typography sx={{ fontWeight: 500 }}>Validação do INSS</Typography>
                        </Stack>
                        <Stack spacing={0.5} sx={{ fontSize: '0.875rem' }}>
                          <Typography variant="body2">
                            INSS do seu holerite: <Typography component="span" sx={{ fontWeight: 500 }}>
                              {formatCurrency(registeredINSS)}
                            </Typography>
                          </Typography>
                          <Typography variant="body2">
                            INSS calculado pela tabela: <Typography component="span" sx={{ fontWeight: 500 }}>
                              {formatCurrency(calculatedINSS)}
                            </Typography>
                          </Typography>
                          {Math.abs(registeredINSS - calculatedINSS) <= 10 ? (
                            <Typography variant="body2" color="success.dark">
                              ✓ Valores estão consistentes
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="warning.dark">
                              ⚠️ Diferença de {formatCurrency(Math.abs(registeredINSS - calculatedINSS))} - verifique seus dados
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                );
              })()}
              
              {/* Resultados */}
              <Stack spacing={2} sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Resultados do INSS</Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <DollarSign style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                      <Typography sx={{ fontWeight: 500 }}>Contribuição Mensal</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.monthlyContribution)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatPercentage(calculation.contributionRate)} do salário
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Clock style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                      <Typography sx={{ fontWeight: 500 }}>Contribuição Anual</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.yearlyContribution)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Valor total no ano
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Clock style={{ width: 16, height: 16, color: '#1976d2' }} />
                      <Typography sx={{ fontWeight: 500 }}>Anos para Aposentadoria</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                      {calculation.yearsToRetirement}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1976d2', opacity: 0.7 }}>
                      Baseado na idade mínima (65 anos)
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Users style={{ width: 16, height: 16, color: 'var(--success)' }} />
                      <Typography sx={{ fontWeight: 500 }}>Benefício Estimado</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
                      {formatCurrency(calculation.estimatedBenefit)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.dark', opacity: 0.7 }}>
                      Aposentadoria mensal estimada
                    </Typography>
                  </Box>
                  </Box>

                {/* Tabela INSS */}
                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                  <Typography sx={{ fontWeight: 500, mb: 1.5 }}>📊 Tabela INSS 2024/2025</Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 0' }}>Faixa Salarial</th>
                          <th style={{ textAlign: 'left', padding: '8px 0' }}>Alíquota</th>
                          <th style={{ textAlign: 'left', padding: '8px 0' }}>Sua Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inssTable.map((bracket, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 0' }}>
                              {formatCurrency(bracket.min)} - {formatCurrency(bracket.max)}
                            </td>
                            <td style={{ padding: '8px 0' }}>{formatPercentage(bracket.rate * 100)}</td>
                            <td style={{ padding: '8px 0' }}>
                              {payrollData.grossSalary >= bracket.min && payrollData.grossSalary <= bracket.max ? (
                                <Typography component="span" sx={{ color: 'success.main', fontWeight: 500 }}>
                                  Sua faixa
                                </Typography>
                              ) : payrollData.grossSalary > bracket.max ? (
                                <Typography component="span" sx={{ color: 'info.main' }}>
                                  Já passou
                                </Typography>
                              ) : (
                                <Typography component="span" sx={{ color: 'text.disabled' }}>
                                  Acima da sua faixa
                                </Typography>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>

                {/* Informações importantes */}
                <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1 }}>
                  <Typography sx={{ fontWeight: 500, mb: 1 }}>ℹ️ Informações importantes:</Typography>
                  <Stack component="ul" spacing={0.5} sx={{ fontSize: '0.875rem', pl: 0, listStyle: 'none' }}>
                    <li>• Contribuição obrigatória descontada do salário bruto</li>
                    <li>• Idade mínima: 65 anos (homens) / 62 anos (mulheres)</li>
                    <li>• Tempo mínimo de contribuição: 20 anos</li>
                    <li>• Teto do INSS: {formatCurrency(7786.02)} (2024)</li>
                    <li>• Cálculos são estimativas baseadas nas regras atuais</li>
                  </Stack>
                </Box>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}