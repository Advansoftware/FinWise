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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Férias</CardTitle>
        </div>
        <CardDescription>
          Calcule o valor das suas férias baseado no seu salário atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle entre modos */}
        <CalculatorModeToggle 
          mode={mode} 
          onModeChange={setMode} 
          hasPayrollData={hasPayrollData}
        />

        {/* Entrada de dados baseada no modo */}
        {mode === 'payroll' ? (
          <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded-md space-y-3">
            <div className="text-sm font-medium">Dados do Holerite Utilizados no Cálculo:</div>
            
            {/* Dados salariais */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">💰 Dados Salariais:</div>
              <div className="text-xs text-muted-foreground pl-2">
                Salário Bruto: <span className="font-medium">{formatCurrency(payrollData.grossSalary)}</span>
              </div>
              <div className="text-xs text-muted-foreground pl-2">
                Salário Líquido: <span className="font-medium">{formatCurrency(payrollData.netSalary)}</span>
              </div>
            </div>

            {/* Descontos regulares */}
            {payrollData.discounts.filter(d => 
              d.type === 'discount' && 
              !d.name.toLowerCase().includes('consignado') &&
              !d.name.toLowerCase().includes('empréstimo') &&
              !d.name.toLowerCase().includes('emprestimo')
            ).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">📊 Descontos Regulares:</div>
                <div className="pl-2 space-y-1">
                  {payrollData.discounts.filter(d => 
                    d.type === 'discount' && 
                    !d.name.toLowerCase().includes('consignado') &&
                    !d.name.toLowerCase().includes('empréstimo') &&
                    !d.name.toLowerCase().includes('emprestimo')
                  ).map((discount, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex justify-between">
                      <span>{discount.name}:</span>
                      <span className="font-medium">{formatCurrency(discount.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empréstimo consignado */}
            {payrollData.discounts.filter(d => 
              d.type === 'discount' && (
                d.name.toLowerCase().includes('consignado') ||
                d.name.toLowerCase().includes('empréstimo') ||
                d.name.toLowerCase().includes('emprestimo')
              )
            ).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">🏦 Empréstimo Consignado:</div>
                <div className="pl-2 space-y-1">
                  {payrollData.discounts.filter(d => 
                    d.type === 'discount' && (
                      d.name.toLowerCase().includes('consignado') ||
                      d.name.toLowerCase().includes('empréstimo') ||
                      d.name.toLowerCase().includes('emprestimo')
                    )
                  ).map((discount, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex justify-between">
                      <span>{discount.name}:</span>
                      <span className="font-medium">{formatCurrency(discount.amount)}</span>
                    </div>
                  ))}
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ✓ Será aplicado nas férias (limite 35%)
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ManualSalaryInput data={manualData} onChange={setManualData} />
        )}

        {/* Entrada de dados */}
        <div className="space-y-2">
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
          <div className="text-xs text-muted-foreground">
            Máximo: 30 dias (férias completas)
          </div>
        </div>

        <Button 
          onClick={calculateVacation} 
          className="w-full"
          disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                   (mode === 'payroll' && !hasPayrollData)}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calcular Férias
        </Button>

        {/* Resultado */}
        {result && (
          <div className="space-y-3 pt-4 border-t">
            <div className="text-sm font-medium">Resultado do Cálculo:</div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Valor das férias ({vacationDays} dias):</span>
                <Badge variant="outline">{formatCurrency(result.vacationSalary)}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">1/3 Constitucional:</span>
                <Badge variant="outline">{formatCurrency(result.oneThirdBonus)}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Bruto:</span>
                <Badge variant="outline">{formatCurrency(result.grossTotal)}</Badge>
              </div>
              
              {/* Detalhamento dos descontos */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">💼 Detalhamento dos Descontos:</div>
                
                {result.detailedDiscounts.inss > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">INSS (proporcional ao holerite):</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(result.detailedDiscounts.inss)}
                    </Badge>
                  </div>
                )}
                
                {result.detailedDiscounts.ir > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">IR (proporcional ao holerite):</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(result.detailedDiscounts.ir)}
                    </Badge>
                  </div>
                )}
                
                {result.detailedDiscounts.otherDiscounts > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Outros descontos (proporcionais):</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(result.detailedDiscounts.otherDiscounts)}
                    </Badge>
                  </div>
                )}
                
                {result.detailedDiscounts.consigned > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Empréstimo consignado (valor fixo):</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(result.detailedDiscounts.consigned)}
                    </Badge>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Total dos Descontos:</span>
                    <Badge variant="outline" className="text-red-600 font-bold text-xs">
                      -{formatCurrency(result.estimatedDiscounts)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Informação específica sobre empréstimo consignado */}
              {result.consignedImpact && mode === 'payroll' && (
                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border border-blue-200 dark:border-blue-500/20">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    💡 Empréstimo Consignado nas Férias de {vacationDays} Dias
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Remuneração disponível: {formatCurrency(result.consignedImpact.availableRemuneration || 0)} (após INSS e IR)</div>
                    <div>Limite máximo: {formatCurrency(result.consignedImpact.maxAllowedOnVacation)} (35% da remuneração disponível)</div>
                    <div>Valor aplicado: {formatCurrency(result.consignedImpact.applicableAmount)}</div>
                    <div className={result.consignedImpact.isWithinLimit ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                      {result.consignedImpact.explanation}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Líquido Estimado:</span>
                <Badge className="bg-green-600 dark:bg-green-600 text-white font-bold">
                  {formatCurrency(result.netTotal)}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-500/10 p-2 rounded border border-blue-200 dark:border-blue-500/20">
              <strong>Nota:</strong> {mode === 'payroll' 
                ? `Cálculo baseado nos valores reais do seu holerite. INSS e IR são calculados proporcionalmente aos ${vacationDays} dias de férias. Empréstimo consignado limitado a 35% da remuneração disponível (após descontos obrigatórios), conforme Portaria MTE nº 435/2025.`
                : 'Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos com regras específicas de consignado, use os dados do holerite.'
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}