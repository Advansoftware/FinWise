'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Calculator } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { calculateConsignedImpactOnVacation, getConsignedLoanFromPayroll, calculateINSSFromSalary, calculateIRFromSalary } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";
import { Box, Stack, Typography } from "@mui/material";

interface VacationCalculatorProps {
  payrollData: PayrollData;
}

export function VacationCalculator({ payrollData }: VacationCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [vacationDays, setVacationDays] = useState(30);
  const [result, setResult] = useState<{
    vacationSalary: number;
    oneThirdBonus: number;
    grossTotal: number;
    detailedDiscounts: {
      inss: number;
      ir: number;
      otherDiscounts: number;
      consigned: number;
    };
    consignedImpact: {
      maxAllowedOnVacation: number;
      applicableAmount: number;
      availableRemuneration?: number;
      isWithinLimit: boolean;
      explanation: string;
    } | null;
    estimatedDiscounts: number;
    netTotal: number;
  } | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  const calculateVacation = () => {
    // Cálculo baseado no salário bruto
    const dailySalary = currentData.grossSalary / 30;
    const vacationSalary = dailySalary * vacationDays;
    const oneThirdBonus = vacationSalary / 3; // 1/3 constitucional
    const grossTotal = vacationSalary + oneThirdBonus;

    // Calcula descontos detalhados baseado no modo
    let detailedDiscounts = {
      inss: 0,
      ir: 0,
      otherDiscounts: 0,
      consigned: 0
    };

    if (mode === 'payroll') {
      // Extrai valores específicos do holerite
      const inssFromPayroll = payrollData.discounts.find(d => 
        d.name.toLowerCase().includes('inss')
      )?.amount || 0;
      
      const irFromPayroll = payrollData.discounts.find(d => 
        d.name.toLowerCase().includes('imposto') || 
        d.name.toLowerCase().includes('ir') ||
        d.name.toLowerCase().includes('renda')
      )?.amount || 0;
      
      // Calcula INSS proporcional: se R$ 556,20 é para 30 dias, para 15 dias seria metade
      const vacationProportion = vacationDays / 30;
      detailedDiscounts.inss = inssFromPayroll * vacationProportion;
      
      // Calcula IR proporcional: baseado na proporção das férias
      detailedDiscounts.ir = irFromPayroll * vacationProportion;
      
      // Outros descontos (proporcionais aos do holerite, excluindo INSS, IR e consignado)
      const otherDiscountsFromPayroll = payrollData.discounts.filter(d => 
        d.type === 'discount' && 
        !d.name.toLowerCase().includes('inss') &&
        !d.name.toLowerCase().includes('imposto') &&
        !d.name.toLowerCase().includes('ir') &&
        !d.name.toLowerCase().includes('renda') &&
        !d.name.toLowerCase().includes('consignado') &&
        !d.name.toLowerCase().includes('empréstimo') &&
        !d.name.toLowerCase().includes('emprestimo')
      );
      
      const otherDiscountsTotal = otherDiscountsFromPayroll.reduce((sum, d) => sum + d.amount, 0);
      detailedDiscounts.otherDiscounts = otherDiscountsTotal * vacationProportion;
      
      // Empréstimo consignado (valor fixo do holerite, respeitando limite de 35% da remuneração disponível)
      const consignedAmount = getConsignedLoanFromPayroll(payrollData);
      if (consignedAmount > 0) {
        // Calcula a remuneração disponível = valor bruto - descontos obrigatórios (INSS + IR)
        const availableRemuneration = grossTotal - detailedDiscounts.inss - detailedDiscounts.ir;
        
        // Limite de 35% sobre a remuneração disponível (após descontos obrigatórios)
        const maxAllowedOnVacation = availableRemuneration * 0.35;
        const applicableAmount = Math.min(consignedAmount, maxAllowedOnVacation);
        
        detailedDiscounts.consigned = applicableAmount;
        
        // Cria o objeto consignedImpact com os valores corretos das férias
        const consignedImpact = {
          maxAllowedOnVacation,
          applicableAmount,
          availableRemuneration,
          isWithinLimit: consignedAmount <= maxAllowedOnVacation,
          explanation: consignedAmount > maxAllowedOnVacation
            ? `Valor excede o limite de 35% da remuneração disponível das férias de ${vacationDays} dias. Aplicando apenas R$ ${applicableAmount.toFixed(2)}`
            : `Valor dentro do limite de 35% da remuneração disponível das férias de ${vacationDays} dias`
        };
      } else {
        detailedDiscounts.consigned = 0;
      }
    } else {
      // Para entrada manual, usa a proporção de desconto baseada na diferença
      const discountRate = currentData.grossSalary > 0 
        ? (currentData.grossSalary - currentData.netSalary) / currentData.grossSalary 
        : 0;
      const totalEstimatedDiscount = grossTotal * discountRate;
      
      // Distribui proporcionalmente (estimativa)
      detailedDiscounts.inss = totalEstimatedDiscount * 0.4; // ~40% do desconto
      detailedDiscounts.ir = totalEstimatedDiscount * 0.3; // ~30% do desconto
      detailedDiscounts.otherDiscounts = totalEstimatedDiscount * 0.3; // ~30% do desconto
    }

    const estimatedDiscounts = detailedDiscounts.inss + detailedDiscounts.ir + detailedDiscounts.otherDiscounts + detailedDiscounts.consigned;
    const netTotal = grossTotal - estimatedDiscounts;

    // Para o modo payroll, o consignedImpact já foi calculado acima
    // Para modo manual, não há empréstimo consignado
    let finalConsignedImpact = null;
    if (mode === 'payroll') {
      const consignedAmount = getConsignedLoanFromPayroll(payrollData);
      if (consignedAmount > 0) {
        // Calcula a remuneração disponível = valor bruto - descontos obrigatórios (INSS + IR)
        const availableRemuneration = grossTotal - detailedDiscounts.inss - detailedDiscounts.ir;
        
        // Limite de 35% sobre a remuneração disponível (após descontos obrigatórios)
        const maxAllowedOnVacation = availableRemuneration * 0.35;
        const applicableAmount = Math.min(consignedAmount, maxAllowedOnVacation);
        
        finalConsignedImpact = {
          maxAllowedOnVacation,
          applicableAmount,
          availableRemuneration,
          isWithinLimit: consignedAmount <= maxAllowedOnVacation,
          explanation: consignedAmount > maxAllowedOnVacation
            ? `Valor excede o limite de 35% da remuneração disponível das férias de ${vacationDays} dias. Aplicando apenas R$ ${applicableAmount.toFixed(2)}`
            : `Valor dentro do limite de 35% da remuneração disponível das férias de ${vacationDays} dias`
        };
      }
    }

    setResult({
      vacationSalary,
      oneThirdBonus,
      grossTotal,
      detailedDiscounts,
      consignedImpact: finalConsignedImpact,
      estimatedDiscounts,
      netTotal,
    });
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader>
        <Stack direction="row" spacing={1} alignItems="center">
          <Plane style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          <Typography component="span" sx={{ fontSize: '1.125rem' }}>
            <CardTitle>Calculadora de Férias</CardTitle>
          </Typography>
        </Stack>
        <Typography component="span">
          <CardDescription>
            Calcule o valor das suas férias baseado no seu salário atual.
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
                      <Typography variant="caption" sx={{ color: 'info.main', mt: 0.5 }}>
                        ✓ Será aplicado nas férias (limite 35%)
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
            <Label htmlFor="vacationDays">Dias de Férias</Label>
            <Input
              id="vacationDays"
              type="number"
              min="1"
              max="30"
              value={vacationDays}
              onChange={(e) => setVacationDays(parseInt(e.target.value) || 30)}
              placeholder="30"
            />
            <Typography variant="caption" color="text.secondary">
              Máximo: 30 dias (férias completas)
            </Typography>
          </Stack>

          <Button 
            onClick={calculateVacation} 
            sx={{ width: '100%' }}
            disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                     (mode === 'payroll' && !hasPayrollData)}
          >
            <Calculator style={{ width: 16, height: 16, marginRight: 8 }} />
            Calcular Férias
          </Button>

          {/* Resultado */}
          {result && (
            <Stack spacing={1.5} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Resultado do Cálculo:</Typography>
              
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Valor das férias ({vacationDays} dias):</Typography>
                  <Badge variant="outline">{formatCurrency(result.vacationSalary)}</Badge>
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">1/3 Constitucional:</Typography>
                  <Badge variant="outline">{formatCurrency(result.oneThirdBonus)}</Badge>
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Bruto:</Typography>
                  <Badge variant="outline">{formatCurrency(result.grossTotal)}</Badge>
                </Stack>
                
                {/* Detalhamento dos descontos */}
                <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={1}>
                    <Typography variant="caption" sx={{ fontWeight: 500, mb: 1 }} color="text.secondary">
                      💼 Detalhamento dos Descontos:
                    </Typography>
                    
                    {result.detailedDiscounts.inss > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">INSS (proporcional ao holerite):</Typography>
                        <Badge variant="outline" sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                          -{formatCurrency(result.detailedDiscounts.inss)}
                        </Badge>
                      </Stack>
                    )}
                    
                    {result.detailedDiscounts.ir > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">IR (proporcional ao holerite):</Typography>
                        <Badge variant="outline" sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                          -{formatCurrency(result.detailedDiscounts.ir)}
                        </Badge>
                      </Stack>
                    )}
                    
                    {result.detailedDiscounts.otherDiscounts > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">Outros descontos (proporcionais):</Typography>
                        <Badge variant="outline" sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                          -{formatCurrency(result.detailedDiscounts.otherDiscounts)}
                        </Badge>
                      </Stack>
                    )}
                    
                    {result.detailedDiscounts.consigned > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">Empréstimo consignado (valor fixo):</Typography>
                        <Badge variant="outline" sx={{ color: 'error.main', fontSize: '0.75rem' }}>
                          -{formatCurrency(result.detailedDiscounts.consigned)}
                        </Badge>
                      </Stack>
                    )}
                    
                    <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>Total dos Descontos:</Typography>
                        <Badge variant="outline" sx={{ color: 'error.main', fontWeight: 700, fontSize: '0.75rem' }}>
                          -{formatCurrency(result.estimatedDiscounts)}
                        </Badge>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
                
                {/* Informação específica sobre empréstimo consignado */}
                {result.consignedImpact && mode === 'payroll' && (
                  <Box sx={{ bgcolor: 'info.light', p: 1.5, borderRadius: 1, border: 1, borderColor: 'info.main' }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: 'info.dark', display: 'block', mb: 0.5 }}>
                      💡 Empréstimo Consignado nas Férias de {vacationDays} Dias
                    </Typography>
                    <Stack spacing={0.5} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      <Typography variant="caption">Remuneração disponível: {formatCurrency(result.consignedImpact.availableRemuneration || 0)} (após INSS e IR)</Typography>
                      <Typography variant="caption">Limite máximo: {formatCurrency(result.consignedImpact.maxAllowedOnVacation)} (35% da remuneração disponível)</Typography>
                      <Typography variant="caption">Valor aplicado: {formatCurrency(result.consignedImpact.applicableAmount)}</Typography>
                      <Typography variant="caption" sx={{ color: result.consignedImpact.isWithinLimit ? 'success.main' : 'warning.main' }}>
                        {result.consignedImpact.explanation}
                      </Typography>
                    </Stack>
                  </Box>
                )}
              
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Total Líquido Estimado:</Typography>
                <Badge sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 700 }}>
                  {formatCurrency(result.netTotal)}
                </Badge>
              </Stack>

                <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'info.light', p: 1, borderRadius: 1, border: 1, borderColor: 'info.main' }}>
                  <strong>Nota:</strong> {mode === 'payroll' 
                    ? `Cálculo baseado nos valores reais do seu holerite. INSS e IR são calculados proporcionalmente aos ${vacationDays} dias de férias. Empréstimo consignado limitado a 35% da remuneração disponível (após descontos obrigatórios), conforme Portaria MTE nº 435/2025.`
                    : 'Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos com regras específicas de consignado, use os dados do holerite.'
                  }
                </Box>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}