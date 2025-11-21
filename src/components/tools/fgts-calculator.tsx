'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";
import { Box, Stack, Typography, Divider } from "@mui/material";

interface FGTSCalculatorProps {
  payrollData: PayrollData;
}

interface FGTSCalculation {
  monthlyDeposit: number;
  yearlyDeposit: number;
  currentBalance: number;
  projectedBalance: number;
  totalWithInterest: number;
}

export function FGTSCalculator({ payrollData }: FGTSCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [workMonths, setWorkMonths] = useState<number>(12);
  const [currentFGTSBalance, setCurrentFGTSBalance] = useState<number>(0);
  const [projectionYears, setProjectionYears] = useState<number>(5);
  const [calculation, setCalculation] = useState<FGTSCalculation | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  const calculateFGTS = () => {
    // FGTS é 8% do salário bruto
    const fgtsRate = 0.08;
    const monthlyDeposit = currentData.grossSalary * fgtsRate;
    const yearlyDeposit = monthlyDeposit * 12;
    
    // Saldo atual projetado baseado nos meses trabalhados
    const currentBalance = currentFGTSBalance + (monthlyDeposit * workMonths);
    
    // Projeção futura com juros de 3% ao ano + TR (aproximadamente 3.5% total)
    const annualInterestRate = 0.035;
    const futureMonths = projectionYears * 12;
    
    // Cálculo de rendimento composto
    let projectedBalance = currentBalance;
    for (let i = 0; i < futureMonths; i++) {
      projectedBalance = projectedBalance * (1 + annualInterestRate / 12) + monthlyDeposit;
    }
    
    const totalWithInterest = projectedBalance;

    setCalculation({
      monthlyDeposit,
      yearlyDeposit,
      currentBalance,
      projectedBalance,
      totalWithInterest
    });
  };

  useEffect(() => {
    calculateFGTS();
  }, [workMonths, currentFGTSBalance, projectionYears, payrollData.grossSalary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <Stack direction="row" spacing={1} alignItems="center">
          <Building style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          <Typography component="span" sx={{ fontSize: '1.125rem' }}>
            <CardTitle>Calculadora de FGTS</CardTitle>
          </Typography>
        </Stack>
        <Typography component="span">
          <CardDescription>
            Calcule os depósitos e o saldo projetado do seu FGTS
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
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Dados do Holerite:
                </Typography>
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

          {/* Inputs simplificados */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
            gap: 2 
          }}>
            <Stack spacing={1}>
              <Label htmlFor="workMonths">Meses trabalhados na empresa atual</Label>
              <Input
                id="workMonths"
                type="number"
                value={workMonths}
                onChange={(e) => setWorkMonths(Number(e.target.value))}
                min="0"
                max="120"
              />
              <Typography variant="caption" color="text.secondary">
                Tempo na empresa atual para calcular saldo
              </Typography>
            </Stack>
            
            <Stack spacing={1}>
              <Label htmlFor="currentBalance">Saldo FGTS atual (R$)</Label>
              <Input
                id="currentBalance"
                type="number"
                value={currentFGTSBalance}
                onChange={(e) => setCurrentFGTSBalance(Number(e.target.value))}
                min="0"
              />
              <Typography variant="caption" color="text.secondary">
                Consulte no app FGTS ou extrato
              </Typography>
            </Stack>
            
            <Stack spacing={1}>
              <Label htmlFor="projectionYears">Projetar para (anos)</Label>
              <Input
                id="projectionYears"
                type="number"
                value={projectionYears}
                onChange={(e) => setProjectionYears(Number(e.target.value))}
                min="1"
                max="40"
              />
              <Typography variant="caption" color="text.secondary">
                Tempo futuro para projeção
              </Typography>
            </Stack>
          </Box>

          {/* Informação automática */}
          <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'info.dark' }}>
              📊 Dados extraídos do seu holerite:
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
              gap: 1.5, 
              fontSize: '0.875rem' 
            }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="info.dark">Salário Bruto:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatCurrency(payrollData.grossSalary)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="info.dark">Depósito FGTS Mensal (8%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatCurrency(payrollData.grossSalary * 0.08)}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Button onClick={calculateFGTS} sx={{ width: '100%' }}>
            <DollarSign style={{ width: 16, height: 16, marginRight: 8 }} />
            Calcular FGTS
          </Button>

          {calculation && (
            <>
              <Divider />
              
              {/* Resultados */}
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Resultados do FGTS
                </Typography>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                  gap: 2 
                }}>
                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Calendar style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Depósito Mensal
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.monthlyDeposit)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      8% do salário bruto
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TrendingUp style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Depósito Anual
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.yearlyDeposit)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Valor total no ano
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Building style={{ width: 16, height: 16, color: 'var(--info-dark)' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Saldo Atual Estimado
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.dark' }}>
                      {formatCurrency(calculation.currentBalance)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'info.dark', opacity: 0.7 }}>
                      Incluindo {workMonths} meses trabalhados
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TrendingUp style={{ width: 16, height: 16, color: 'var(--success-dark)' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Projeção em {projectionYears} anos
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark' }}>
                      {formatCurrency(calculation.totalWithInterest)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.dark', opacity: 0.7 }}>
                      Com juros e correção monetária
                    </Typography>
                  </Box>
                </Box>

                {/* Informações adicionais */}
                <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'warning.dark' }}>
                    ℹ️ Informações importantes:
                  </Typography>
                  <Stack component="ul" spacing={0.5} sx={{ 
                    fontSize: '0.875rem', 
                    color: 'warning.dark',
                    pl: 2 
                  }}>
                    <li>• O FGTS é depositado mensalmente pelo empregador (8% do salário bruto)</li>
                    <li>• Rendimento atual: 3% ao ano + TR (Taxa Referencial)</li>
                    <li>• Pode ser sacado em situações específicas (demissão, compra da casa própria, etc.)</li>
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