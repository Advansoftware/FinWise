'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Stack, 
  Paper,
  useTheme,
  alpha,
  MenuItem,
  Divider,
  Chip
} from '@mui/material';
import { Briefcase, AlertTriangle, DollarSign, FileText, Info } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface SeveranceCalculatorProps {
  payrollData: PayrollData;
}

interface SeveranceCalculation {
  avisoPrevia: number;
  salarioAviso: number;
  feriasPendentes: number;
  decimoTerceiro: number;
  fgtsBalance: number;
  fgtsFine: number;
  totalReceive: number;
  rescissionType: string;
}

type RescissionType = 'demissao-sem-justa-causa' | 'demissao-com-justa-causa' | 'pedido-demissao' | 'comum-acordo';

export function SeveranceCalculator({ payrollData }: SeveranceCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [workYears, setWorkYears] = useState<number>(2);
  const [workMonths, setWorkMonths] = useState<number>(0);
  const [dismissalType, setDismissalType] = useState<string>('sem-justa-causa');
  const [rescissionType, setRescissionType] = useState<RescissionType>('demissao-sem-justa-causa');
  const [vacationDays, setVacationDays] = useState<number>(0);
  const [fgtsBalance, setFgtsBalance] = useState<number>(0);
  const [calculation, setCalculation] = useState<SeveranceCalculation | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  const calculateSeverance = () => {
    const dailySalary = payrollData.grossSalary / 30;
    
    let avisoPrevia = 0;
    let salarioAviso = 0;
    let feriasPendentes = 0;
    let decimoTerceiro = 0;
    let fgtsFine = 0;

    // Cálculo baseado no tipo de rescisão
    switch (rescissionType) {
      case 'demissao-sem-justa-causa':
        // Aviso prévio (30 dias + 3 dias por ano trabalhado, máximo 90 dias)
        const yearsWorked = Math.floor(workMonths / 12);
        const noticeDays = Math.min(30 + (yearsWorked * 3), 90);
        avisoPrevia = noticeDays;
        salarioAviso = dailySalary * noticeDays;
        
        // Férias proporcionais + 1/3
        feriasPendentes = (dailySalary * vacationDays) * 1.333;
        
        // 13º salário proporcional
        decimoTerceiro = (payrollData.grossSalary / 12) * (workMonths % 12);
        
        // Multa FGTS 40%
        fgtsFine = fgtsBalance * 0.4;
        break;

      case 'demissao-com-justa-causa':
        // Apenas saldo de salário e férias vencidas (se houver)
        feriasPendentes = vacationDays > 30 ? (dailySalary * (vacationDays - 30)) * 1.333 : 0;
        break;

      case 'pedido-demissao':
        // Férias proporcionais + 1/3 e 13º proporcional
        feriasPendentes = (dailySalary * vacationDays) * 1.333;
        decimoTerceiro = (payrollData.grossSalary / 12) * (workMonths % 12);
        // Sem multa FGTS e pode sacar apenas em casos específicos
        break;

      case 'comum-acordo':
        // 50% do aviso prévio, férias + 1/3, 13º proporcional, multa FGTS 20%
        const noticeAgreement = Math.min(30 + (Math.floor(workMonths / 12) * 3), 90);
        avisoPrevia = noticeAgreement / 2;
        salarioAviso = (dailySalary * noticeAgreement) / 2;
        feriasPendentes = (dailySalary * vacationDays) * 1.333;
        decimoTerceiro = (payrollData.grossSalary / 12) * (workMonths % 12);
        fgtsFine = fgtsBalance * 0.2;
        break;
    }

    const totalReceive = salarioAviso + feriasPendentes + decimoTerceiro + fgtsFine;

    setCalculation({
      avisoPrevia,
      salarioAviso,
      feriasPendentes,
      decimoTerceiro,
      fgtsBalance,
      fgtsFine,
      totalReceive,
      rescissionType
    });
  };

  useEffect(() => {
    calculateSeverance();
  }, [workMonths, vacationDays, rescissionType, fgtsBalance, payrollData.grossSalary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRescissionTitle = (type: RescissionType) => {
    const titles = {
      'demissao-sem-justa-causa': 'Demissão sem Justa Causa',
      'demissao-com-justa-causa': 'Demissão com Justa Causa',
      'pedido-demissao': 'Pedido de Demissão',
      'comum-acordo': 'Comum Acordo'
    };
    return titles[type];
  };

  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Briefcase style={{ width: '1.25rem', height: '1.25rem', color: theme.palette.primary.main }} />
            Calculadora de Rescisão
          </Box>
        }
        subheader="Calcule os valores da rescisão trabalhista conforme a CLT"
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

          {/* Inputs de rescisão */}
          <Paper variant="outlined" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), p: 2, borderColor: alpha(theme.palette.info.main, 0.2) }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'info.main' }}>
              📊 Dados extraídos do seu holerite:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Salário Bruto:</Typography>
                <Typography variant="caption" fontWeight="medium">{formatCurrency(payrollData.grossSalary)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Salário Líquido:</Typography>
                <Typography variant="caption" fontWeight="medium">{formatCurrency(payrollData.netSalary)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Salário Diário:</Typography>
                <Typography variant="caption" fontWeight="medium">{formatCurrency(payrollData.grossSalary / 30)}</Typography>
              </Stack>
            </Box>
          </Paper>

          {/* Inputs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField
              select
              label="Tipo de rescisão"
              value={rescissionType}
              onChange={(e) => setRescissionType(e.target.value as RescissionType)}
              fullWidth
              size="small"
            >
              <MenuItem value="demissao-sem-justa-causa">Demissão sem Justa Causa</MenuItem>
              <MenuItem value="demissao-com-justa-causa">Demissão com Justa Causa</MenuItem>
              <MenuItem value="pedido-demissao">Pedido de Demissão</MenuItem>
              <MenuItem value="comum-acordo">Comum Acordo (Art. 484-A)</MenuItem>
            </TextField>

            <TextField
              label="Meses trabalhados"
              type="number"
              value={workMonths}
              onChange={(e) => setWorkMonths(Number(e.target.value))}
              inputProps={{ min: 1, max: 600 }}
              fullWidth
              size="small"
            />
            
            <TextField
              label="Dias de férias pendentes"
              type="number"
              value={vacationDays}
              onChange={(e) => setVacationDays(Number(e.target.value))}
              inputProps={{ min: 0, max: 60 }}
              fullWidth
              size="small"
            />
            
            <TextField
              label="Saldo FGTS (R$)"
              type="number"
              value={fgtsBalance}
              onChange={(e) => setFgtsBalance(Number(e.target.value))}
              inputProps={{ min: 0 }}
              fullWidth
              size="small"
            />
          </Box>

          <Button 
            variant="contained" 
            size="large"
            onClick={calculateSeverance} 
            startIcon={<FileText />}
            fullWidth
          >
            Calcular Rescisão
          </Button>

          {calculation && (
            <>
              <Divider />
              
              {/* Resultados */}
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Rescisão: {getRescissionTitle(rescissionType)}
                  </Typography>
                </Stack>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                  {calculation.salarioAviso > 0 && (
                    <Paper variant="outlined" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), p: 2, borderColor: alpha(theme.palette.info.main, 0.2) }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <AlertTriangle style={{ width: 16, height: 16, color: theme.palette.info.main }} />
                        <Typography variant="body2" fontWeight="medium">Aviso Prévio</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {formatCurrency(calculation.salarioAviso)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {calculation.avisoPrevia} dias
                      </Typography>
                    </Paper>
                  )}

                  {calculation.feriasPendentes > 0 && (
                    <Paper variant="outlined" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), p: 2, borderColor: alpha(theme.palette.success.main, 0.2) }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <DollarSign style={{ width: 16, height: 16, color: theme.palette.success.main }} />
                        <Typography variant="body2" fontWeight="medium">Férias + 1/3</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(calculation.feriasPendentes)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vacationDays} dias pendentes
                      </Typography>
                    </Paper>
                  )}

                  {calculation.decimoTerceiro > 0 && (
                    <Paper variant="outlined" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), p: 2, borderColor: alpha(theme.palette.secondary.main, 0.2) }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <DollarSign style={{ width: 16, height: 16, color: theme.palette.secondary.main }} />
                        <Typography variant="body2" fontWeight="medium">13º Proporcional</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                        {formatCurrency(calculation.decimoTerceiro)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {workMonths % 12} meses
                      </Typography>
                    </Paper>
                  )}

                  {calculation.fgtsFine > 0 && (
                    <Paper variant="outlined" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), p: 2, borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Briefcase style={{ width: 16, height: 16, color: theme.palette.warning.main }} />
                        <Typography variant="body2" fontWeight="medium">Multa FGTS</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        {formatCurrency(calculation.fgtsFine)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rescissionType === 'comum-acordo' ? '20%' : '40%'} do saldo
                      </Typography>
                    </Paper>
                  )}

                  <Paper variant="outlined" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), p: 2, gridColumn: { md: 'span 2' }, borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <DollarSign style={{ width: 16, height: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" fontWeight="medium">Total a Receber</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.totalReceive)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Valor bruto (antes dos descontos)
                    </Typography>
                  </Paper>
                </Box>

                {/* Informações específicas por tipo */}
                <Paper variant="outlined" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), p: 2, borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={16} /> Informações sobre {getRescissionTitle(rescissionType)}:
                  </Typography>
                  <Stack component="ul" spacing={0.5} sx={{ fontSize: '0.875rem', color: 'text.secondary', pl: 2, m: 0 }}>
                    {rescissionType === 'demissao-sem-justa-causa' && (
                      <>
                        <li>• Direito a seguro-desemprego (se elegível)</li>
                        <li>• Saque total do FGTS + multa de 40%</li>
                        <li>• Aviso prévio: 30 dias + 3 dias por ano trabalhado</li>
                        <li>• Desconto de INSS e IR sobre verbas rescisórias</li>
                      </>
                    )}
                    {rescissionType === 'demissao-com-justa-causa' && (
                      <>
                        <li>• Sem direito a seguro-desemprego</li>
                        <li>• Sem direito ao FGTS e multa</li>
                        <li>• Apenas saldo de salário e férias vencidas</li>
                        <li>• Justa causa deve ser comprovada pelo empregador</li>
                      </>
                    )}
                    {rescissionType === 'pedido-demissao' && (
                      <>
                        <li>• Sem direito a seguro-desemprego</li>
                        <li>• Sem direito à multa do FGTS</li>
                        <li>• FGTS pode ser sacado apenas em casos específicos</li>
                        <li>• Aviso prévio pode ser dispensado pelo empregador</li>
                      </>
                    )}
                    {rescissionType === 'comum-acordo' && (
                      <>
                        <li>• 50% do aviso prévio e multa FGTS (20%)</li>
                        <li>• Pode sacar até 80% do FGTS</li>
                        <li>• Sem direito a seguro-desemprego</li>
                        <li>• Modalidade criada pela Lei 13.467/2017</li>
                      </>
                    )}
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