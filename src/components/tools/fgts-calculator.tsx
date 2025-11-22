'use client';

import {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, Typography, TextField, Button, Divider, Box, Stack, Paper, useTheme, alpha, InputAdornment} from '@mui/material';
import { Building, Calendar, DollarSign, TrendingUp, Info } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

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

  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Building style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            Calculadora de FGTS
          </Box>
        }
        subheader="Calcule os depósitos e o saldo projetado do seu FGTS"
        titleTypographyProps={{ variant: 'h6' }}
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
          {mode === 'payroll' ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.2) }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info size={16} /> Dados do Holerite:
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>
                  Salário Bruto: <Box component="span" fontWeight="medium">{formatCurrency(payrollData.grossSalary)}</Box>
                </Typography>
              </Stack>
            </Paper>
          ) : (
            <ManualSalaryInput data={manualData} onChange={setManualData} />
          )}

          {/* Inputs simplificados */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
            gap: 2 
          }}>
            <TextField
              label="Meses trabalhados"
              type="number"
              value={workMonths}
              onChange={(e) => setWorkMonths(Number(e.target.value))}
              helperText="Tempo na empresa atual"
              inputProps={{ min: 0, max: 120 }}
              fullWidth
              size="small"
            />
            
            <TextField
              label="Saldo FGTS atual (R$)"
              type="number"
              value={currentFGTSBalance}
              onChange={(e) => setCurrentFGTSBalance(Number(e.target.value))}
              helperText="Consulte no app FGTS"
              inputProps={{ min: 0 }}
              fullWidth
              size="small"
            />
            
            <TextField
              label="Projetar para (anos)"
              type="number"
              value={projectionYears}
              onChange={(e) => setProjectionYears(Number(e.target.value))}
              helperText="Tempo futuro"
              inputProps={{ min: 1, max: 40 }}
              fullWidth
              size="small"
            />
          </Box>

          {/* Informação automática */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.2) }}>
            <Typography variant="subtitle2" color="info.main" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info size={16} /> Dados extraídos do seu holerite:
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
              gap: 1.5, 
              fontSize: '0.875rem' 
            }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Salário Bruto:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(payrollData.grossSalary)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Depósito FGTS Mensal (8%):</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(payrollData.grossSalary * 0.08)}
                </Typography>
              </Stack>
            </Box>
          </Paper>

          <Button 
            variant="contained" 
            size="large"
            onClick={calculateFGTS} 
            startIcon={<DollarSign />}
            fullWidth
          >
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
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.1) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Calendar style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" fontWeight="medium">
                        Depósito Mensal
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.monthlyDeposit)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      8% do salário bruto
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.1) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TrendingUp style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" fontWeight="medium">
                        Depósito Anual
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.yearlyDeposit)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Valor total no ano
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.2) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Building style={{ width: 16, height: 16, color: theme.palette.info.main }} />
                      <Typography variant="body2" fontWeight="medium" color="info.main">
                        Saldo Atual Estimado
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {formatCurrency(calculation.currentBalance)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Incluindo {workMonths} meses trabalhados
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: alpha(theme.palette.success.main, 0.2) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TrendingUp style={{ width: 16, height: 16, color: theme.palette.success.main }} />
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        Projeção em {projectionYears} anos
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(calculation.totalWithInterest)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Com juros e correção monetária
                    </Typography>
                  </Paper>
                </Box>

                {/* Informações adicionais */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={16} /> Informações importantes:
                  </Typography>
                  <Stack component="ul" spacing={0.5} sx={{ 
                    fontSize: '0.875rem', 
                    color: 'text.secondary',
                    pl: 2,
                    m: 0
                  }}>
                    <li>• O FGTS é depositado mensalmente pelo empregador (8% do salário bruto)</li>
                    <li>• Rendimento atual: 3% ao ano + TR (Taxa Referencial)</li>
                    <li>• Pode ser sacado em situações específicas (demissão, compra da casa própria, etc.)</li>
                    <li>• Cálculos são estimativas baseadas nas regras atuais</li>
                  </Stack>
                </Paper>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}