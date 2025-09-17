'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Calculator } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { calculateConsignedImpactOnVacation, getConsignedLoanFromPayroll } from "@/lib/payroll-utils";

interface VacationCalculatorProps {
  payrollData: PayrollData;
}

export function VacationCalculator({ payrollData }: VacationCalculatorProps) {
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

  const calculateVacation = () => {
    // Cálculo baseado no salário bruto
    const dailySalary = payrollData.grossSalary / 30;
    const vacationSalary = dailySalary * vacationDays;
    const oneThirdBonus = vacationSalary / 3; // 1/3 constitucional
    const grossTotal = vacationSalary + oneThirdBonus;

    // Calcula o impacto correto do empréstimo consignado nas férias
    const consignedAmount = getConsignedLoanFromPayroll(payrollData);
    const consignedImpact = consignedAmount > 0 
      ? calculateConsignedImpactOnVacation(payrollData.grossSalary, consignedAmount)
      : null;
    
    // Calcula descontos regulares baseado na proporção do holerite
    // mas exclui o empréstimo consignado pois ele tem regras específicas
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
    const totalDiscounts = estimatedRegularDiscounts + consignedDiscount;
    const netTotal = grossTotal - totalDiscounts;

    setResult({
      vacationSalary,
      oneThirdBonus,
      grossTotal,
      consignedImpact,
      estimatedDiscounts: totalDiscounts,
      netTotal,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Férias</CardTitle>
        </div>
        <CardDescription>
          Calcule o valor das suas férias baseado no seu salário atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações base */}
        <div className="bg-muted/30 p-3 rounded-md space-y-2">
          <div className="text-sm font-medium">Dados do Holerite:</div>
          <div className="text-xs text-muted-foreground">
            Salário Bruto: <span className="font-medium">{formatCurrency(payrollData.grossSalary)}</span>
          </div>
        </div>

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

        <Button onClick={calculateVacation} className="w-full">
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
              {result.consignedImpact && (
                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border">
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
                <Badge className="bg-green-600 text-white font-bold">
                  {formatCurrency(result.netTotal)}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-500/10 p-2 rounded">
              <strong>Nota:</strong> Cálculo inclui estimativa de descontos baseada no seu holerite. Empréstimo consignado nas férias segue regra específica de até 35% do valor bruto.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}