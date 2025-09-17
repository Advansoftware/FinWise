'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Calculator } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { calculateConsignedImpactOnThirteenth, getConsignedLoanFromPayroll } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface ThirteenthSalaryCalculatorProps {
  payrollData: PayrollData;
}

export function ThirteenthSalaryCalculator({ payrollData }: ThirteenthSalaryCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [monthsWorked, setMonthsWorked] = useState(12);
  const [result, setResult] = useState<{
    grossThirteenth: number;
    estimatedDiscounts: number;
    consignedImpact: {
      maxAllowedOnThirteenth: number;
      applicableAmount: number;
      isWithinLimit: boolean;
      explanation: string;
    } | null;
    netThirteenth: number;
  } | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

    const calculateThirteenth = () => {
    // Cálculo proporcional baseado nos meses trabalhados
    const grossThirteenth = (currentData.grossSalary / 12) * monthsWorked;
    
    // 13º salário NÃO sofre desconto de empréstimo consignado
    // Apenas descontos regulares (INSS, IR, etc.)
    
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
      
      estimatedDiscounts = grossThirteenth * regularDiscountRate;
    } else {
      // Para entrada manual, usa a proporção de desconto baseada na diferença
      const discountRate = currentData.grossSalary > 0 
        ? (currentData.grossSalary - currentData.netSalary) / currentData.grossSalary 
        : 0;
      estimatedDiscounts = grossThirteenth * discountRate;
    }
    
    const netThirteenth = grossThirteenth - estimatedDiscounts;

    setResult({
      grossThirteenth,
      estimatedDiscounts,
      consignedImpact: null, // 13º não tem desconto de consignado
      netThirteenth,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora do 13º Salário</CardTitle>
        </div>
        <CardDescription>
          Estime o valor do seu 13º salário baseado no período trabalhado.
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
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Salário Bruto: <span className="font-medium">{formatCurrency(payrollData.grossSalary)}</span></div>
              <div>Salário Líquido: <span className="font-medium">{formatCurrency(payrollData.netSalary)}</span></div>
            </div>
          </div>
        ) : (
          <ManualSalaryInput data={manualData} onChange={setManualData} />
        )}

        {/* Entrada de dados */}
        <div className="space-y-2">
          <Label htmlFor="monthsWorked">Meses Trabalhados no Ano</Label>
          <Input
            id="monthsWorked"
            type="number"
            min="1"
            max="12"
            value={monthsWorked}
            onChange={(e) => setMonthsWorked(parseInt(e.target.value) || 12)}
            placeholder="12"
          />
          <div className="text-xs text-muted-foreground">
            Máximo: 12 meses (ano completo)
          </div>
        </div>

        <Button 
          onClick={calculateThirteenth} 
          className="w-full"
          disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                   (mode === 'payroll' && !hasPayrollData)}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calcular 13º Salário
        </Button>

        {/* Resultado */}
        {result && (
          <div className="space-y-3 pt-4 border-t">
            <div className="text-sm font-medium">Resultado do Cálculo:</div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">13º Salário Bruto ({monthsWorked}/12):</span>
                <Badge variant="outline">{formatCurrency(result.grossThirteenth)}</Badge>
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
                    💡 Empréstimo Consignado no 13º Salário
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Limite máximo: {formatCurrency(result.consignedImpact.maxAllowedOnThirteenth)} (35% do 13º)</div>
                    <div>Valor aplicado: {formatCurrency(result.consignedImpact.applicableAmount)}</div>
                    <div className={result.consignedImpact.isWithinLimit ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                      {result.consignedImpact.explanation}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">13º Líquido Estimado:</span>
                <Badge className="bg-green-600 dark:bg-green-600 text-white font-bold">
                  {formatCurrency(result.netThirteenth)}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-500/10 p-2 rounded border-blue-200 dark:border-blue-500/20">
              <strong>Nota:</strong> {mode === 'payroll' 
                ? 'Os descontos são estimados baseados na proporção do seu holerite atual. Valores reais podem variar conforme faixas do INSS e IR.'
                : 'Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos, use os dados do holerite.'
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}