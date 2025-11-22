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
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
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
import { CreditCard, Percent, Calendar, DollarSign, AlertTriangle, Info } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface ConsignedLoanProps {
  payrollData: PayrollData;
}

interface LoanCalculation {
  availableMargin: number;
  maxLoanAmount: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  installments: LoanInstallment[];
}

interface LoanInstallment {
  number: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function ConsignedLoanCalculator({ payrollData }: ConsignedLoanProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [employeeType, setEmployeeType] = useState<'clt' | 'public' | 'inss'>('clt');
  const [loanAmount, setLoanAmount] = useState<number>(10000);
  const [interestRate, setInterestRate] = useState<number>(1.5);
  const [termMonths, setTermMonths] = useState<number>(60);
  const [currentLoans, setCurrentLoans] = useState<number>(0);
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  // Margens consignáveis por tipo de trabalhador
  const getMarginRate = (type: string) => {
    switch (type) {
      case 'clt': return 0.30; // 30% para CLT
      case 'public': return 0.35; // 35% para servidor público
      case 'inss': return 0.45; // 45% para aposentado/pensionista
      default: return 0.30;
    }
  };

  const calculateLoan = () => {
    const netSalary = payrollData.netSalary;
    const marginRate = getMarginRate(employeeType);
    
    // Margem disponível
    const totalMargin = netSalary * marginRate;
    const availableMargin = Math.max(0, totalMargin - currentLoans);
    
    // Taxa mensal
    const monthlyRate = interestRate / 100;
    
    // Cálculo de parcela (Sistema SAC ou Price)
    const monthlyPayment = Math.min(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1),
      availableMargin
    );
    
    // Valor máximo do empréstimo baseado na margem disponível
    const maxLoanAmount = (availableMargin * (Math.pow(1 + monthlyRate, termMonths) - 1)) / 
                         (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
    
    // Simulação das parcelas
    const installments: LoanInstallment[] = [];
    let balance = loanAmount;
    let totalInterest = 0;
    
    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      totalInterest += interestPayment;
      
      installments.push({
        number: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }
    
    const totalAmount = loanAmount + totalInterest;

    setCalculation({
      availableMargin,
      maxLoanAmount,
      monthlyPayment,
      totalAmount,
      totalInterest,
      installments
    });
  };

  useEffect(() => {
    calculateLoan();
  }, [employeeType, loanAmount, termMonths, interestRate, currentLoans, payrollData.netSalary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getEmployeeTypeLabel = (type: string) => {
    switch (type) {
      case 'clt': return 'CLT (30% margem)';
      case 'public': return 'Servidor Público (35% margem)';
      case 'retired': return 'Aposentado/Pensionista (45% margem)';
      default: return type;
    }
  };

  const theme = useTheme();

  // ... existing code ...

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            Simulador de Empréstimo Consignado
          </Box>
        }
        subheader="Simule empréstimos com desconto direto na folha de pagamento"
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <Stack spacing={3}>
        {/* Informação automática */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.2) }}>
          <Typography variant="subtitle2" color="info.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info size={16} /> Dados extraídos do seu holerite:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" color="info.dark">Salário Bruto:</Typography>
              <Typography variant="body2" fontWeight="medium">{formatCurrency(payrollData.grossSalary)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="info.dark">Salário Líquido:</Typography>
              <Typography variant="body2" fontWeight="medium">{formatCurrency(payrollData.netSalary)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="info.dark">Margem Total ({formatPercentage(getMarginRate(employeeType) * 100)}):</Typography>
              <Typography variant="body2" fontWeight="medium">{formatCurrency(payrollData.netSalary * getMarginRate(employeeType))}</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Inputs */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="employee-type-label">Tipo de trabalhador</InputLabel>
            <Select
              labelId="employee-type-label"
              value={employeeType}
              label="Tipo de trabalhador"
              onChange={(e) => setEmployeeType(e.target.value as 'clt' | 'public' | 'inss')}
            >
              <MenuItem value="clt">CLT - 30% margem</MenuItem>
              <MenuItem value="public">Servidor Público - 35% margem</MenuItem>
              <MenuItem value="inss">Aposentado/Pensionista - 45% margem</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Consignações atuais (R$)"
            type="number"
            value={currentLoans}
            onChange={(e) => setCurrentLoans(Number(e.target.value))}
            InputProps={{ inputProps: { min: 0 } }}
            fullWidth
          />
          
          <TextField
            label="Valor desejado (R$)"
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            InputProps={{ inputProps: { min: 1000, max: 500000 } }}
            fullWidth
          />
          
          <TextField
            label="Prazo (meses)"
            type="number"
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            InputProps={{ inputProps: { min: 6, max: 96 } }}
            fullWidth
          />
          
          <TextField
            label="Taxa de juros (% a.m.)"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            InputProps={{ 
              inputProps: { min: 0.5, max: 5.0, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
            fullWidth
          />
        </Box>

        <Button 
          variant="contained" 
          size="large" 
          onClick={calculateLoan} 
          startIcon={<CreditCard />}
          fullWidth
        >
          Simular Empréstimo
        </Button>

        {calculation && (
          <Stack spacing={3}>
            <Divider />
            
            {/* Resultados */}
            <Box>
              <Typography variant="h6" gutterBottom>Simulação - {getEmployeeTypeLabel(employeeType)}</Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: alpha(theme.palette.info.main, 0.2) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DollarSign size={16} color={theme.palette.info.main} />
                    <Typography variant="subtitle2">Margem Disponível</Typography>
                  </Box>
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    {formatCurrency(calculation.availableMargin)}
                  </Typography>
                  <Typography variant="caption" color="info.dark">
                    Para novas consignações
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: alpha(theme.palette.success.main, 0.2) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CreditCard size={16} color={theme.palette.success.main} />
                    <Typography variant="subtitle2">Valor Máximo</Typography>
                  </Box>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {formatCurrency(calculation.maxLoanAmount)}
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    Com sua margem atual
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Calendar size={16} color={theme.palette.primary.main} />
                    <Typography variant="subtitle2">Parcela Mensal</Typography>
                  </Box>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {formatCurrency(calculation.monthlyPayment)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {termMonths}x de {formatCurrency(calculation.monthlyPayment)}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Percent size={16} color={theme.palette.primary.main} />
                    <Typography variant="subtitle2">Total de Juros</Typography>
                  </Box>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {formatCurrency(calculation.totalInterest)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total: {formatCurrency(calculation.totalAmount)}
                  </Typography>
                </Paper>
              </Box>
            </Box>

            {/* Validação da margem */}
            {calculation.monthlyPayment > calculation.availableMargin && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderColor: alpha(theme.palette.error.main, 0.2) }}>
                <Typography variant="subtitle2" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AlertTriangle size={16} /> Atenção
                </Typography>
                <Typography variant="body2" color="error.dark">
                  Valor da parcela excede a margem disponível. Reduza o valor ou aumente o prazo.
                </Typography>
              </Paper>
            )}

            {/* Resumo financeiro */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>💰 Resumo Financeiro</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Salário Líquido:</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(payrollData.netSalary)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Margem Total ({formatPercentage(getMarginRate(employeeType) * 100)}):</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(payrollData.netSalary * getMarginRate(employeeType))}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Consignações Atuais:</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(currentLoans)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Margem Disponível:</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatCurrency(calculation.availableMargin)}</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Primeiras parcelas */}
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2">📋 Primeiras 6 Parcelas</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parcela</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Juros</TableCell>
                      <TableCell>Amortização</TableCell>
                      <TableCell>Saldo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculation.installments.slice(0, 6).map((installment) => (
                      <TableRow key={installment.number}>
                        <TableCell>{installment.number}ª</TableCell>
                        <TableCell>{formatCurrency(installment.payment)}</TableCell>
                        <TableCell>{formatCurrency(installment.interest)}</TableCell>
                        <TableCell>{formatCurrency(installment.principal)}</TableCell>
                        <TableCell>{formatCurrency(installment.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Informações importantes */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderColor: alpha(theme.palette.warning.main, 0.2) }}>
              <Typography variant="subtitle2" color="warning.dark" sx={{ mb: 1 }}>ℹ️ Informações importantes:</Typography>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="warning.dark">• Desconto direto na folha de pagamento garante menores taxas</Typography>
                <Typography variant="caption" color="warning.dark">• Margem consignável: CLT (30%), Servidor (35%), Aposentado (45%)</Typography>
                <Typography variant="caption" color="warning.dark">• Taxas variam entre 1,5% a 3,5% a.m. dependendo do banco</Typography>
                <Typography variant="caption" color="warning.dark">• Simulação considera Sistema Price (parcelas fixas)</Typography>
                <Typography variant="caption" color="warning.dark">• Consulte seu banco para condições específicas</Typography>
              </Stack>
            </Paper>
          </Stack>
        )}
        </Stack>
      </CardContent>
    </Card>
  );
}