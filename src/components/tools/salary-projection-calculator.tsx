'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface SalaryProjectionCalculatorProps {
  payrollData: PayrollData;
}

export function SalaryProjectionCalculator({ payrollData }: SalaryProjectionCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [increasePercentage, setIncreasePercentage] = useState(5);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [result, setResult] = useState<{
    newGrossSalary: number;
    newNetSalary: number;
    monthlyIncrease: number;
    yearlyIncrease: number;
    totalEarnings: number;
  } | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  const calculateProjection = () => {
    const increaseMultiplier = 1 + (increasePercentage / 100);
    const newGrossSalary = currentData.grossSalary * increaseMultiplier;
    
    // Estima o novo salário líquido mantendo a mesma proporção de descontos
    const discountRate = currentData.grossSalary > 0 
      ? (currentData.grossSalary - currentData.netSalary) / currentData.grossSalary 
      : 0;
    
    const newNetSalary = newGrossSalary * (1 - discountRate);
    const monthlyIncrease = newNetSalary - currentData.netSalary;
    const yearlyIncrease = monthlyIncrease * 12;
    const totalEarnings = newNetSalary * projectionMonths;

    setResult({
      newGrossSalary,
      newNetSalary,
      monthlyIncrease,
      yearlyIncrease,
      totalEarnings,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Projeção Salarial</CardTitle>
        </div>
        <CardDescription>
          Projete seus ganhos futuros com base em aumentos salariais.
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
            <div className="text-sm font-medium">Situação Atual:</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Bruto:</span>
                <div className="font-medium">{formatCurrency(payrollData.grossSalary)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Líquido:</span>
                <div className="font-medium">{formatCurrency(payrollData.netSalary)}</div>
              </div>
            </div>
          </div>
        ) : (
          <ManualSalaryInput data={manualData} onChange={setManualData} />
        )}

        {/* Configurações da projeção */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="increasePercentage">Aumento (%)</Label>
            <Select value={increasePercentage.toString()} onValueChange={(value) => setIncreasePercentage(parseFloat(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3% - Ajuste Inflação</SelectItem>
                <SelectItem value="5">5% - Aumento Padrão</SelectItem>
                <SelectItem value="10">10% - Promoção</SelectItem>
                <SelectItem value="15">15% - Mudança de Cargo</SelectItem>
                <SelectItem value="20">20% - Nova Empresa</SelectItem>
                <SelectItem value="25">25% - Especialização</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectionMonths">Período (meses)</Label>
            <Input
              id="projectionMonths"
              type="number"
              min="1"
              max="60"
              value={projectionMonths}
              onChange={(e) => setProjectionMonths(parseInt(e.target.value) || 12)}
              placeholder="12"
            />
          </div>
        </div>

        <Button 
          onClick={calculateProjection} 
          className="w-full"
          disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                   (mode === 'payroll' && !hasPayrollData)}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calcular Projeção
        </Button>

        {/* Resultados */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm font-medium">Projeção com {increasePercentage}% de aumento:</div>
            
            {/* Novos salários */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-500/10 p-3 rounded-md border border-green-200 dark:border-green-500/20">
                <div className="text-sm text-muted-foreground">Novo Salário Bruto</div>
                <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(result.newGrossSalary)}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-md border border-blue-200 dark:border-blue-500/20">
                <div className="text-sm text-muted-foreground">Novo Salário Líquido</div>
                <div className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(result.newNetSalary)}</div>
              </div>
            </div>

            {/* Aumentos */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Aumento Mensal:</span>
                <Badge className="bg-green-600 dark:bg-green-600 text-white">
                  +{formatCurrency(result.monthlyIncrease)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Aumento Anual:</span>
                <Badge className="bg-green-600 dark:bg-green-600 text-white">
                  +{formatCurrency(result.yearlyIncrease)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total em {projectionMonths} meses:</span>
                <Badge className="bg-primary dark:bg-primary text-white font-bold">
                  {formatCurrency(result.totalEarnings)}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-500/10 p-2 rounded border border-blue-200 dark:border-blue-500/20">
              <strong>Nota:</strong> {mode === 'payroll' 
                ? 'Esta é uma projeção estimada baseada nos dados do seu holerite. Os valores reais podem variar conforme mudanças na legislação e faixas de desconto.'
                : 'Projeção baseada nos dados informados manualmente. Para estimativas mais precisas, use os dados do holerite.'
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}