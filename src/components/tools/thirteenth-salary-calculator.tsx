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

interface ThirteenthSalaryCalculatorProps {
  payrollData: PayrollData;
}

export function ThirteenthSalaryCalculator({ payrollData }: ThirteenthSalaryCalculatorProps) {
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

  const calculateThirteenth = () => {
    // Cálculo proporcional baseado nos meses trabalhados
    const grossThirteenth = (payrollData.grossSalary / 12) * monthsWorked;
    
    // Calcula o impacto correto do empréstimo consignado no 13º salário
    const consignedAmount = getConsignedLoanFromPayroll(payrollData);
    const consignedImpact = consignedAmount > 0 
      ? calculateConsignedImpactOnThirteenth(grossThirteenth, consignedAmount)
      : null;
    
    // Calcula descontos regulares (INSS, IR) baseado na proporção do holerite
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
    
    const estimatedRegularDiscounts = grossThirteenth * regularDiscountRate;
    const consignedDiscount = consignedImpact?.applicableAmount || 0;
    const totalDiscounts = estimatedRegularDiscounts + consignedDiscount;
    const netThirteenth = grossThirteenth - totalDiscounts;

    setResult({
      grossThirteenth,
      estimatedDiscounts: totalDiscounts,
      consignedImpact,
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
        {/* Informações base */}
        <div className="bg-muted/30 p-3 rounded-md space-y-2">
          <div className="text-sm font-medium">Dados do Holerite:</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Salário Bruto: <span className="font-medium">{formatCurrency(payrollData.grossSalary)}</span></div>
            <div>Salário Líquido: <span className="font-medium">{formatCurrency(payrollData.netSalary)}</span></div>
          </div>
        </div>

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

        <Button onClick={calculateThirteenth} className="w-full">
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
              {result.consignedImpact && (
                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border">
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
                <Badge className="bg-green-600 text-white font-bold">
                  {formatCurrency(result.netThirteenth)}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-500/10 p-2 rounded">
              <strong>Nota:</strong> Os descontos são estimados baseados na proporção do seu holerite atual. 
              Valores reais podem variar conforme faixas do INSS e IR.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}