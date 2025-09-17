'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { PayrollData } from "@/lib/types";

interface FGTSCalculatorProps {
  payrollData: PayrollData;
}

interface FGTSCalculation {
  monthlyDeposit: number;
  yearlyDeposit: number;
  currentBalance: number;
  projectedBalance: number;
  totalWithInterest: number;
}

export function FGTSCalculator({ payrollData }: FGTSCalculatorProps) {
  const [workMonths, setWorkMonths] = useState<number>(12);
  const [currentFGTSBalance, setCurrentFGTSBalance] = useState<number>(0);
  const [projectionYears, setProjectionYears] = useState<number>(5);
  const [calculation, setCalculation] = useState<FGTSCalculation | null>(null);

  const calculateFGTS = () => {
    // FGTS é 8% do salário bruto
    const fgtsRate = 0.08;
    const monthlyDeposit = payrollData.grossSalary * fgtsRate;
    const yearlyDeposit = monthlyDeposit * 12;
    
    // Saldo atual projetado baseado nos meses trabalhados
    const currentBalance = currentFGTSBalance + (monthlyDeposit * workMonths);
    
    // Projeção futura com juros de 3% ao ano + TR (aproximadamente 3.5% total)
    const annualInterestRate = 0.035;
    const futureMonths = projectionYears * 12;
    
    // Cálculo de rendimento composto
    let projectedBalance = currentBalance;
    for (let i = 0; i < futureMonths; i++) {
      projectedBalance = projectedBalance * (1 + annualInterestRate / 12) + monthlyDeposit;
    }
    
    const totalWithInterest = projectedBalance;

    setCalculation({
      monthlyDeposit,
      yearlyDeposit,
      currentBalance,
      projectedBalance,
      totalWithInterest
    });
  };

  useEffect(() => {
    calculateFGTS();
  }, [workMonths, currentFGTSBalance, projectionYears, payrollData.grossSalary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de FGTS</CardTitle>
        </div>
        <CardDescription>
          Calcule os depósitos e o saldo projetado do seu FGTS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs simplificados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workMonths">Meses trabalhados na empresa atual</Label>
            <Input
              id="workMonths"
              type="number"
              value={workMonths}
              onChange={(e) => setWorkMonths(Number(e.target.value))}
              min="0"
              max="120"
            />
            <p className="text-xs text-muted-foreground">Tempo na empresa atual para calcular saldo</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currentBalance">Saldo FGTS atual (R$)</Label>
            <Input
              id="currentBalance"
              type="number"
              value={currentFGTSBalance}
              onChange={(e) => setCurrentFGTSBalance(Number(e.target.value))}
              min="0"
            />
            <p className="text-xs text-muted-foreground">Consulte no app FGTS ou extrato</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectionYears">Projetar para (anos)</Label>
            <Input
              id="projectionYears"
              type="number"
              value={projectionYears}
              onChange={(e) => setProjectionYears(Number(e.target.value))}
              min="1"
              max="40"
            />
            <p className="text-xs text-muted-foreground">Tempo futuro para projeção</p>
          </div>
        </div>

        {/* Informação automática */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📊 Dados extraídos do seu holerite:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-600">Salário Bruto:</span>
              <span className="float-right font-medium">{formatCurrency(payrollData.grossSalary)}</span>
            </div>
            <div>
              <span className="text-blue-600">Depósito FGTS Mensal (8%):</span>
              <span className="float-right font-medium">{formatCurrency(payrollData.grossSalary * 0.08)}</span>
            </div>
          </div>
        </div>

        <Button onClick={calculateFGTS} className="w-full">
          <DollarSign className="h-4 w-4 mr-2" />
          Calcular FGTS
        </Button>

        {calculation && (
          <>
            <Separator />
            
            {/* Resultados */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Resultados do FGTS</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">Depósito Mensal</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.monthlyDeposit)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    8% do salário bruto
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">Depósito Anual</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.yearlyDeposit)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valor total no ano
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Saldo Atual Estimado</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculation.currentBalance)}
                  </p>
                  <p className="text-sm text-blue-600/70">
                    Incluindo {workMonths} meses trabalhados
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Projeção em {projectionYears} anos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculation.totalWithInterest)}
                  </p>
                  <p className="text-sm text-green-600/70">
                    Com juros e correção monetária
                  </p>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">ℹ️ Informações importantes:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• O FGTS é depositado mensalmente pelo empregador (8% do salário bruto)</li>
                  <li>• Rendimento atual: 3% ao ano + TR (Taxa Referencial)</li>
                  <li>• Pode ser sacado em situações específicas (demissão, compra da casa própria, etc.)</li>
                  <li>• Cálculos são estimativas baseadas nas regras atuais</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}