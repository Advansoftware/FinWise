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
import { calculateConsignedImpactOnVacation, getConsignedLoanFromPayroll } from "@/lib/payroll-utils";
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
    consignedImpact: {
      maxAllowedOnVacation: number;
      applicableAmount: number;
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

    // Calcula o impacto correto do empréstimo consignado nas férias (apenas para dados do holerite)
    const consignedAmount = mode === 'payroll' ? getConsignedLoanFromPayroll(payrollData) : 0;
    const consignedImpact = consignedAmount > 0 
      ? calculateConsignedImpactOnVacation(payrollData.grossSalary, consignedAmount)
      : null;
    
    // Calcula descontos estimados baseado no modo
    let estimatedDiscounts = 0;
    
    if (mode === 'payroll') {
      // Para dados do holerite, calcula descontos regulares excluindo consignado
      const regularDiscounts = payrollData.discounts.filter(d => 
        d.type === 'discount' && 
        !d.name.toLowerCase().includes('consignado') &&
        !d.name.toLowerCase().includes('empréstimo') &&
        !d.name.toLowerCase().includes('emprestimo')
      );
      
      const regularDiscountRate = payrollData.grossSalary > 0 
        ? regularDiscounts.reduce((sum, d) => sum + d.amount, 0) / payrollData.grossSalary 
        : 0;
      
      const estimatedRegularDiscounts = grossTotal * regularDiscountRate;
      const consignedDiscount = consignedImpact?.applicableAmount || 0;
      estimatedDiscounts = estimatedRegularDiscounts + consignedDiscount;
    } else {
      // Para entrada manual, usa a proporção de desconto baseada na diferença
      const discountRate = currentData.grossSalary > 0 
        ? (currentData.grossSalary - currentData.netSalary) / currentData.grossSalary 
        : 0;
      estimatedDiscounts = grossTotal * discountRate;
    }
    
    const netTotal = grossTotal - estimatedDiscounts;

    setResult({
      vacationSalary,
      oneThirdBonus,
      grossTotal,
      consignedImpact,
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
          <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded-md space-y-2">
            <div className="text-sm font-medium">Dados do Holerite:</div>
            <div className="text-xs text-muted-foreground">
              Salário Bruto: <span className="font-medium">{formatCurrency(payrollData.grossSalary)}</span>
            </div>
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
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Descontos Estimados:</span>
                <Badge variant="outline" className="text-red-600">
                  -{formatCurrency(result.estimatedDiscounts)}
                </Badge>
              </div>
              
              {/* Informação específica sobre empréstimo consignado */}
              {result.consignedImpact && mode === 'payroll' && (
                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border border-blue-200 dark:border-blue-500/20">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    💡 Empréstimo Consignado nas Férias
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Limite máximo: {formatCurrency(result.consignedImpact.maxAllowedOnVacation)} (35% das férias + 1/3)</div>
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
                ? 'Cálculo inclui estimativa de descontos baseada no seu holerite. Nas férias, o empréstimo consignado é descontado normalmente (até 35% da remuneração + 1/3), conforme Portaria MTE nº 435/2025, junto com INSS e IR.'
                : 'Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos com regras específicas de consignado, use os dados do holerite.'
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}