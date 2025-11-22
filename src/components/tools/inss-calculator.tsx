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
  Paper,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Shield, Clock, DollarSign, Users, AlertCircle, CheckCircle, Info } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { getINSSFromPayroll, calculateINSSFromSalary, validatePayrollData } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

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

  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            Calculadora de INSS
          </Box>
        }
        subheader="Calcule sua contribuição previdenciária e estimativa de aposentadoria"
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

          {/* Inputs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              label="Idade atual"
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              inputProps={{ min: 18, max: 70 }}
              fullWidth
              size="small"
            />
            
            <TextField
              label="Anos já contribuídos"
              type="number"
              value={contributionYears}
              onChange={(e) => setContributionYears(Number(e.target.value))}
              inputProps={{ min: 0, max: 50 }}
              fullWidth
              size="small"
            />
          </Box>

          <Button 
            variant="contained" 
            size="large"
            onClick={calculateINSS} 
            startIcon={<Shield />}
            fullWidth
          >
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
                const isConsistent = Math.abs(registeredINSS - calculatedINSS) <= 10;
                
                return (
                  <Stack spacing={2}>
                    {registeredINSS > 0 && (
                      <Paper variant="outlined" sx={{ 
                        bgcolor: isConsistent ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                        borderColor: isConsistent ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.warning.main, 0.2),
                        p: 2
                      }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          {isConsistent ? (
                            <CheckCircle style={{ width: 16, height: 16, color: theme.palette.success.main }} />
                          ) : (
                            <AlertCircle style={{ width: 16, height: 16, color: theme.palette.warning.main }} />
                          )}
                          <Typography variant="subtitle2" color={isConsistent ? 'success.main' : 'warning.main'}>
                            Validação do INSS
                          </Typography>
                        </Stack>
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            INSS do seu holerite: <Box component="span" fontWeight="medium">{formatCurrency(registeredINSS)}</Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            INSS calculado pela tabela: <Box component="span" fontWeight="medium">{formatCurrency(calculatedINSS)}</Box>
                          </Typography>
                          {isConsistent ? (
                            <Typography variant="caption" color="success.main" fontWeight="medium">
                              ✓ Valores estão consistentes
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="warning.main" fontWeight="medium">
                              ⚠️ Diferença de {formatCurrency(Math.abs(registeredINSS - calculatedINSS))} - verifique seus dados
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                );
              })()}
              
              {/* Resultados */}
              <Stack spacing={2} sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Resultados do INSS</Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.1) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <DollarSign style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" fontWeight="medium">Contribuição Mensal</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.monthlyContribution)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatPercentage(calculation.contributionRate)} do salário
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.1) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Clock style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" fontWeight="medium">Contribuição Anual</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.yearlyContribution)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Valor total no ano
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.2) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Clock style={{ width: 16, height: 16, color: theme.palette.info.main }} />
                      <Typography variant="body2" fontWeight="medium" color="info.main">Anos para Aposentadoria</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {calculation.yearsToRetirement}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Baseado na idade mínima (65 anos)
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: alpha(theme.palette.success.main, 0.2) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Users style={{ width: 16, height: 16, color: theme.palette.success.main }} />
                      <Typography variant="body2" fontWeight="medium" color="success.main">Benefício Estimado</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(calculation.estimatedBenefit)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Aposentadoria mensal estimada
                    </Typography>
                  </Paper>
                </Box>

                {/* Tabela INSS */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.1) }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>📊 Tabela INSS 2024/2025</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Faixa Salarial</TableCell>
                          <TableCell>Alíquota</TableCell>
                          <TableCell>Sua Situação</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inssTable.map((bracket, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {formatCurrency(bracket.min)} - {formatCurrency(bracket.max)}
                            </TableCell>
                            <TableCell>{formatPercentage(bracket.rate * 100)}</TableCell>
                            <TableCell>
                              {payrollData.grossSalary >= bracket.min && payrollData.grossSalary <= bracket.max ? (
                                <Chip label="Sua faixa" color="success" size="small" variant="outlined" />
                              ) : payrollData.grossSalary > bracket.max ? (
                                <Chip label="Já passou" color="info" size="small" variant="outlined" />
                              ) : (
                                <Typography variant="caption" color="text.disabled">
                                  Acima da sua faixa
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Informações importantes */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={16} /> Informações importantes:
                  </Typography>
                  <Stack component="ul" spacing={0.5} sx={{ fontSize: '0.875rem', pl: 2, m: 0, color: 'text.secondary' }}>
                    <li>• Contribuição obrigatória descontada do salário bruto</li>
                    <li>• Idade mínima: 65 anos (homens) / 62 anos (mulheres)</li>
                    <li>• Tempo mínimo de contribuição: 20 anos</li>
                    <li>• Teto do INSS: {formatCurrency(7786.02)} (2024)</li>
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