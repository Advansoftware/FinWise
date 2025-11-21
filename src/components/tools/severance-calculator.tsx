'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, AlertTriangle, DollarSign, FileText } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";
import { Box, Stack, Typography, Divider } from "@mui/material";

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

  return (
    <Card>
      <CardHeader>
        <Stack direction="row" spacing={1} alignItems="center">
          <Briefcase style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          <Typography component="span" sx={{ fontSize: '1.125rem' }}>
            <CardTitle>Calculadora de Rescisão</CardTitle>
          </Typography>
        </Stack>
        <Typography component="span">
          <CardDescription>
            Calcule os valores da rescisão trabalhista conforme a CLT
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

          {/* Inputs de rescisão */}
          <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'info.dark' }}>
              📊 Dados extraídos do seu holerite:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, fontSize: '0.875rem' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="info.dark">Salário Bruto:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(payrollData.grossSalary)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="info.dark">Salário Líquido:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(payrollData.netSalary)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="info.dark">Salário Diário:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(payrollData.grossSalary / 30)}</Typography>
              </Stack>
            </Box>
          </Box>

          {/* Inputs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Stack spacing={1}>
              <Label htmlFor="rescissionType">Tipo de rescisão</Label>
              <Select value={rescissionType} onValueChange={(value: RescissionType) => setRescissionType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demissao-sem-justa-causa">Demissão sem Justa Causa</SelectItem>
                  <SelectItem value="demissao-com-justa-causa">Demissão com Justa Causa</SelectItem>
                  <SelectItem value="pedido-demissao">Pedido de Demissão</SelectItem>
                  <SelectItem value="comum-acordo">Comum Acordo (Art. 484-A)</SelectItem>
                </SelectContent>
              </Select>
            </Stack>

            <Stack spacing={1}>
              <Label htmlFor="workMonths">Meses trabalhados</Label>
              <Input
                id="workMonths"
                type="number"
                value={workMonths}
                onChange={(e) => setWorkMonths(Number(e.target.value))}
                min="1"
                max="600"
              />
            </Stack>
            
            <Stack spacing={1}>
              <Label htmlFor="vacationDays">Dias de férias pendentes</Label>
              <Input
                id="vacationDays"
                type="number"
                value={vacationDays}
                onChange={(e) => setVacationDays(Number(e.target.value))}
                min="0"
                max="60"
              />
            </Stack>
            
            <Stack spacing={1}>
              <Label htmlFor="fgtsBalance">Saldo FGTS (R$)</Label>
              <Input
                id="fgtsBalance"
                type="number"
                value={fgtsBalance}
                onChange={(e) => setFgtsBalance(Number(e.target.value))}
                min="0"
              />
            </Stack>
          </Box>

          <Button onClick={calculateSeverance} sx={{ width: '100%' }}>
            <FileText style={{ width: 16, height: 16, marginRight: 8 }} />
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
                    <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <AlertTriangle style={{ width: 16, height: 16, color: 'var(--info-dark)' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Aviso Prévio</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.dark' }}>
                        {formatCurrency(calculation.salarioAviso)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'info.dark', opacity: 0.7 }}>
                        {calculation.avisoPrevia} dias
                      </Typography>
                    </Box>
                  )}

                  {calculation.feriasPendentes > 0 && (
                    <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <DollarSign style={{ width: 16, height: 16, color: 'var(--success-dark)' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Férias + 1/3</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.dark' }}>
                        {formatCurrency(calculation.feriasPendentes)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.dark', opacity: 0.7 }}>
                        {vacationDays} dias pendentes
                      </Typography>
                    </Box>
                  )}

                  {calculation.decimoTerceiro > 0 && (
                    <Box sx={{ bgcolor: '#f3e5f5', p: 2, borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <DollarSign style={{ width: 16, height: 16, color: '#7b1fa2' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>13º Proporcional</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                        {formatCurrency(calculation.decimoTerceiro)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#7b1fa2', opacity: 0.7 }}>
                        {workMonths % 12} meses
                      </Typography>
                    </Box>
                  )}

                  {calculation.fgtsFine > 0 && (
                    <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Briefcase style={{ width: 16, height: 16, color: '#e65100' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Multa FGTS</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#e65100' }}>
                        {formatCurrency(calculation.fgtsFine)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#e65100', opacity: 0.7 }}>
                        {rescissionType === 'comum-acordo' ? '20%' : '40%'} do saldo
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 1, gridColumn: { md: 'span 2' } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <DollarSign style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Total a Receber</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(calculation.totalReceive)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', opacity: 0.7 }}>
                      Valor bruto (antes dos descontos)
                    </Typography>
                  </Box>
                </Box>

                {/* Informações específicas por tipo */}
                <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'warning.dark' }}>
                    ℹ️ Informações sobre {getRescissionTitle(rescissionType)}:
                  </Typography>
                  <Stack component="ul" spacing={0.5} sx={{ fontSize: '0.875rem', color: 'warning.dark', pl: 2 }}>
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
                </Box>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}