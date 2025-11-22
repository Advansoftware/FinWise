'use client';

import { useState, useEffect } from 'react';
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
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  useTheme,
  alpha,
  InputAdornment
} from '@mui/material';
import { Receipt, TrendingDown, TrendingUp, Calculator, AlertCircle, CheckCircle } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { getINSSFromPayroll, getIRFromPayroll, calculateIRFromSalary, validatePayrollData } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface IncomeTaxCalculatorProps {
  payrollData: PayrollData;
}

interface IncomeTaxCalculation {
  monthlyIR: number;
  yearlyIR: number;
  grossAnnualIncome: number;
  taxableIncome: number;
  deductions: number;
  effectiveRate: number;
  estimatedRefund: number;
  bracket: string;
}

export function IncomeTaxCalculator({ payrollData }: IncomeTaxCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [dependents, setDependents] = useState<number>(0);
  const [medicalExpenses, setMedicalExpenses] = useState<number>(0);
  const [educationExpenses, setEducationExpenses] = useState<number>(0);
  const [inssContribution, setInssContribution] = useState<number>(0);
  const [calculation, setCalculation] = useState<IncomeTaxCalculation | null>(null);
  const theme = useTheme();

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  // Tabela IR 2024/2025
  const irTable = [
    { min: 0, max: 2259.20, rate: 0, deduction: 0 },
    { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
    { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
    { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
    { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 }
  ];

  const calculateIncomeTax = () => {
    const grossMonthly = payrollData.grossSalary;
    const grossAnnual = grossMonthly * 12;

    // Usar INSS e IR reais do holerite
    const registeredINSS = getINSSFromPayroll(payrollData);
    const registeredIR = getIRFromPayroll(payrollData);
    
    // Usar INSS do holerite ou informado pelo usuário, ou calcular se não houver
    const monthlyINSS = inssContribution || registeredINSS || (() => {
      if (grossMonthly <= 1412.00) return grossMonthly * 0.075;
      else if (grossMonthly <= 2666.68) return grossMonthly * 0.09;
      else if (grossMonthly <= 4000.03) return grossMonthly * 0.12;
      else return Math.min(grossMonthly * 0.14, 908.85);
    })();

    // Deduções legais
    const dependentDeduction = dependents * 189.59 * 12; // R$ 189,59 por dependente/mês
    const maxEducationDeduction = 3561.50 * 12; // Limite anual educação
    const educationDeductionAnnual = Math.min(educationExpenses, maxEducationDeduction);
    
    const inssAnnual = monthlyINSS * 12;
    const totalDeductions = dependentDeduction + medicalExpenses + educationDeductionAnnual + inssAnnual;
    
    // Base de cálculo do IR
    const taxableIncome = Math.max(0, grossAnnual - totalDeductions);
    const taxableMonthly = taxableIncome / 12;

    // Encontrar faixa e calcular IR
    let bracket = '';
    let monthlyIR = 0;
    
    for (const range of irTable) {
      if (taxableMonthly >= range.min && taxableMonthly <= range.max) {
        monthlyIR = Math.max(0, (taxableMonthly * range.rate) - range.deduction);
        bracket = `${range.rate * 100}%`;
        break;
      }
    }

    const yearlyIR = monthlyIR * 12;
    const effectiveRate = grossMonthly > 0 ? (monthlyIR / grossMonthly) * 100 : 0;
    
    // Estimativa de restituição usando IR real do holerite se disponível
    const currentMonthlyDiscount = registeredIR || payrollData.discounts?.find(d => 
      d.name.toLowerCase().includes('ir') || d.name.toLowerCase().includes('imposto')
    )?.amount || 0;
    
    const estimatedRefund = (currentMonthlyDiscount * 12) - yearlyIR;

    setCalculation({
      monthlyIR,
      yearlyIR,
      grossAnnualIncome: grossAnnual,
      taxableIncome,
      deductions: totalDeductions,
      effectiveRate,
      estimatedRefund,
      bracket
    });
  };

  useEffect(() => {
    calculateIncomeTax();
  }, [dependents, medicalExpenses, educationExpenses, inssContribution, payrollData]);

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
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            Calculadora de Imposto de Renda
          </Box>
        }
        subheader="Calcule seu IR mensal, anual e estimativa de restituição"
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
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Dados do Holerite:</Typography>
            <Typography variant="caption" color="text.secondary">
              Salário Bruto: <Typography component="span" variant="caption" fontWeight="medium">{formatCurrency(payrollData.grossSalary)}</Typography>
            </Typography>
          </Paper>
        ) : (
          <ManualSalaryInput data={manualData} onChange={setManualData} />
        )}

        {/* Inputs para cálculos */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <TextField
            label="Número de dependentes"
            type="number"
            value={dependents}
            onChange={(e) => setDependents(Number(e.target.value))}
            inputProps={{ min: 0, max: 10 }}
            fullWidth
          />
          
          <TextField
            label="Gastos médicos/ano (R$)"
            type="number"
            value={medicalExpenses}
            onChange={(e) => setMedicalExpenses(Number(e.target.value))}
            inputProps={{ min: 0 }}
            fullWidth
          />
          
          <TextField
            label="Gastos educação/ano (R$)"
            type="number"
            value={educationExpenses}
            onChange={(e) => setEducationExpenses(Number(e.target.value))}
            inputProps={{ min: 0 }}
            fullWidth
          />

          {!getINSSFromPayroll(payrollData) && (
            <TextField
              label="Desconto INSS mensal (R$)"
              type="number"
              value={inssContribution}
              onChange={(e) => setInssContribution(Number(e.target.value))}
              inputProps={{ min: 0 }}
              placeholder="Será calculado automaticamente"
              fullWidth
              helperText="Deixe 0 para calcular automaticamente"
            />
          )}
        </Box>

        <Button 
          onClick={calculateIncomeTax} 
          variant="contained" 
          fullWidth
          startIcon={<Calculator />}
        >
          Calcular Imposto de Renda
        </Button>


        {calculation && (
          <Stack spacing={3}>
            <Divider />
            
            {/* Validação dos dados */}
            {(() => {
              const registeredIR = getIRFromPayroll(payrollData);
              const registeredINSS = getINSSFromPayroll(payrollData);
              const calculatedIR = calculateIRFromSalary(payrollData.grossSalary, registeredINSS, dependents);
              
              return (
                <Stack spacing={2}>
                  {registeredIR > 0 && (
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        bgcolor: Math.abs(registeredIR - calculatedIR) <= 20 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                        borderColor: Math.abs(registeredIR - calculatedIR) <= 20 ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.warning.main, 0.3)
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {Math.abs(registeredIR - calculatedIR) <= 20 ? (
                          <CheckCircle style={{ width: '1rem', height: '1rem', color: theme.palette.success.main }} />
                        ) : (
                          <AlertCircle style={{ width: '1rem', height: '1rem', color: theme.palette.warning.main }} />
                        )}
                        <Typography variant="subtitle2" fontWeight="medium">Validação do IR</Typography>
                      </Box>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">IR do seu holerite: <strong>{formatCurrency(registeredIR)}</strong></Typography>
                        <Typography variant="body2">IR calculado pela tabela: <strong>{formatCurrency(calculatedIR)}</strong></Typography>
                        {Math.abs(registeredIR - calculatedIR) <= 20 ? (
                          <Typography variant="caption" color="success.main">✓ Valores estão consistentes</Typography>
                        ) : (
                          <Typography variant="caption" color="warning.main">⚠️ Diferença pode indicar dependentes ou outras deduções não consideradas</Typography>
                        )}
                      </Stack>
                    </Paper>
                  )}
                  
                  {registeredINSS > 0 && (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.3) }}>
                      <Typography variant="body2" color="info.main">
                        💡 <strong>Usando dados do seu holerite:</strong> INSS de {formatCurrency(registeredINSS)} 
                        {registeredIR > 0 && ` e IR de ${formatCurrency(registeredIR)}`}
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              );
            })()}
            
            {/* Resultados */}
            <Stack spacing={2}>
              <Typography variant="h6">Resultados do Imposto de Renda</Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Receipt style={{ width: '1rem', height: '1rem', color: theme.palette.primary.main }} />
                    <Typography variant="subtitle2">IR Mensal</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatCurrency(calculation.monthlyIR)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Faixa: {calculation.bracket}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUp style={{ width: '1rem', height: '1rem', color: theme.palette.primary.main }} />
                    <Typography variant="subtitle2">IR Anual</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatCurrency(calculation.yearlyIR)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatPercentage(calculation.effectiveRate)} do salário
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Calculator style={{ width: '1rem', height: '1rem', color: theme.palette.info.main }} />
                    <Typography variant="subtitle2">Base de Cálculo</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {formatCurrency(calculation.taxableIncome)}
                  </Typography>
                  <Typography variant="caption" color="info.main" sx={{ opacity: 0.8 }}>
                    Renda tributável anual
                  </Typography>
                </Paper>

                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: calculation.estimatedRefund > 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1)
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {calculation.estimatedRefund > 0 ? (
                      <TrendingDown style={{ width: '1rem', height: '1rem', color: theme.palette.success.main }} />
                    ) : (
                      <TrendingUp style={{ width: '1rem', height: '1rem', color: theme.palette.error.main }} />
                    )}
                    <Typography variant="subtitle2">
                      {calculation.estimatedRefund > 0 ? 'Restituição Estimada' : 'Imposto a Pagar'}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold" 
                    color={calculation.estimatedRefund > 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(Math.abs(calculation.estimatedRefund))}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={calculation.estimatedRefund > 0 ? 'success.main' : 'error.main'}
                    sx={{ opacity: 0.8 }}
                  >
                    {calculation.estimatedRefund > 0 ? 'A receber' : 'A complementar'}
                  </Typography>
                </Paper>
              </Box>
            </Stack>

              {/* Resumo das deduções */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>📊 Resumo das Deduções</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span">Renda Bruta Anual:</Typography>
                    <Typography variant="body2" fontWeight="medium" component="span" sx={{ float: 'right' }}>{formatCurrency(calculation.grossAnnualIncome)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span">INSS (12 meses):</Typography>
                    <Typography variant="body2" fontWeight="medium" component="span" sx={{ float: 'right' }}>{formatCurrency(inssContribution * 12)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span">Dependentes ({dependents}):</Typography>
                    <Typography variant="body2" fontWeight="medium" component="span" sx={{ float: 'right' }}>{formatCurrency(dependents * 189.59 * 12)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span">Gastos Médicos:</Typography>
                    <Typography variant="body2" fontWeight="medium" component="span" sx={{ float: 'right' }}>{formatCurrency(medicalExpenses)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span">Gastos Educação:</Typography>
                    <Typography variant="body2" fontWeight="medium" component="span" sx={{ float: 'right' }}>{formatCurrency(Math.min(educationExpenses, 3561.50 * 12))}</Typography>
                  </Box>
                  <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1, mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" component="span">Total Deduções:</Typography>
                    <Typography variant="body2" fontWeight="bold" component="span" sx={{ float: 'right' }}>{formatCurrency(calculation.deductions)}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Tabela IR */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>📋 Tabela IR 2024/2025 (Mensal)</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Base de Cálculo</TableCell>
                        <TableCell>Alíquota</TableCell>
                        <TableCell>Dedução</TableCell>
                        <TableCell>Sua Situação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {irTable.map((bracket, index) => {
                        const taxableMonthly = calculation.taxableIncome / 12;
                        const isCurrentBracket = taxableMonthly >= bracket.min && taxableMonthly <= bracket.max;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {bracket.max === Infinity 
                                ? `Acima de ${formatCurrency(bracket.min)}`
                                : `${formatCurrency(bracket.min)} - ${formatCurrency(bracket.max)}`
                              }
                            </TableCell>
                            <TableCell>{formatPercentage(bracket.rate * 100)}</TableCell>
                            <TableCell>{formatCurrency(bracket.deduction)}</TableCell>
                            <TableCell>
                              {isCurrentBracket ? (
                                <Typography variant="caption" color="success.main" fontWeight="medium">Sua faixa</Typography>
                              ) : taxableMonthly > bracket.max ? (
                                <Typography variant="caption" color="primary.main">Já passou</Typography>
                              ) : (
                                <Typography variant="caption" color="text.disabled">Acima da sua faixa</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Informações importantes */}
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                <Typography variant="subtitle2" color="warning.dark" sx={{ mb: 1 }}>ℹ️ Informações importantes:</Typography>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="warning.dark">• Cálculo baseado na tabela 2024/2025 da Receita Federal</Typography>
                  <Typography variant="caption" color="warning.dark">• Deduções: INSS, dependentes (R$ 189,59), saúde (ilimitado), educação (até R$ 3.561,50)</Typography>
                  <Typography variant="caption" color="warning.dark">• Estimativa de restituição considera apenas IR na fonte vs IR devido</Typography>
                  <Typography variant="caption" color="warning.dark">• Para declaração completa, considere outras rendas e deduções</Typography>
                  <Typography variant="caption" color="warning.dark">• Consulte um contador para casos complexos</Typography>
                </Stack>
              </Paper>
            </Stack>
        )}
      </Stack>
      </CardContent>
    </Card>
  );
}