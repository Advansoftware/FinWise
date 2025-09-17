'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, TrendingDown, TrendingUp, Calculator, AlertCircle, CheckCircle } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { getINSSFromPayroll, getIRFromPayroll, calculateIRFromSalary, validatePayrollData } from "@/lib/payroll-utils";

interface IncomeTaxCalculatorProps {
  payrollData: PayrollData;
}

interface IncomeTaxCalculation {
  monthlyIR: number;
  yearlyIR: number;
  grossAnnualIncome: number;
  taxableIncome: number;
  deductions: number;
  effectiveRate: number;
  estimatedRefund: number;
  bracket: string;
}

export function IncomeTaxCalculator({ payrollData }: IncomeTaxCalculatorProps) {
  const [dependents, setDependents] = useState<number>(0);
  const [medicalExpenses, setMedicalExpenses] = useState<number>(0);
  const [educationExpenses, setEducationExpenses] = useState<number>(0);
  const [inssContribution, setInssContribution] = useState<number>(0);
  const [calculation, setCalculation] = useState<IncomeTaxCalculation | null>(null);

  // Tabela IR 2024/2025
  const irTable = [
    { min: 0, max: 2259.20, rate: 0, deduction: 0 },
    { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
    { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
    { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
    { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 }
  ];

  const calculateIncomeTax = () => {
    const grossMonthly = payrollData.grossSalary;
    const grossAnnual = grossMonthly * 12;

    // Usar INSS e IR reais do holerite
    const registeredINSS = getINSSFromPayroll(payrollData);
    const registeredIR = getIRFromPayroll(payrollData);
    
    // Usar INSS do holerite ou informado pelo usuário, ou calcular se não houver
    const monthlyINSS = inssContribution || registeredINSS || (() => {
      if (grossMonthly <= 1412.00) return grossMonthly * 0.075;
      else if (grossMonthly <= 2666.68) return grossMonthly * 0.09;
      else if (grossMonthly <= 4000.03) return grossMonthly * 0.12;
      else return Math.min(grossMonthly * 0.14, 908.85);
    })();

    // Deduções legais
    const dependentDeduction = dependents * 189.59 * 12; // R$ 189,59 por dependente/mês
    const maxEducationDeduction = 3561.50 * 12; // Limite anual educação
    const educationDeductionAnnual = Math.min(educationExpenses, maxEducationDeduction);
    
    const inssAnnual = monthlyINSS * 12;
    const totalDeductions = dependentDeduction + medicalExpenses + educationDeductionAnnual + inssAnnual;
    
    // Base de cálculo do IR
    const taxableIncome = Math.max(0, grossAnnual - totalDeductions);
    const taxableMonthly = taxableIncome / 12;

    // Encontrar faixa e calcular IR
    let bracket = '';
    let monthlyIR = 0;
    
    for (const range of irTable) {
      if (taxableMonthly >= range.min && taxableMonthly <= range.max) {
        monthlyIR = Math.max(0, (taxableMonthly * range.rate) - range.deduction);
        bracket = `${range.rate * 100}%`;
        break;
      }
    }

    const yearlyIR = monthlyIR * 12;
    const effectiveRate = grossMonthly > 0 ? (monthlyIR / grossMonthly) * 100 : 0;
    
    // Estimativa de restituição usando IR real do holerite se disponível
    const currentMonthlyDiscount = registeredIR || payrollData.discounts?.find(d => 
      d.name.toLowerCase().includes('ir') || d.name.toLowerCase().includes('imposto')
    )?.amount || 0;
    
    const estimatedRefund = (currentMonthlyDiscount * 12) - yearlyIR;

    setCalculation({
      monthlyIR,
      yearlyIR,
      grossAnnualIncome: grossAnnual,
      taxableIncome,
      deductions: totalDeductions,
      effectiveRate,
      estimatedRefund,
      bracket
    });
  };

  useEffect(() => {
    calculateIncomeTax();
  }, [dependents, medicalExpenses, educationExpenses, inssContribution, payrollData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Imposto de Renda</CardTitle>
        </div>
        <CardDescription>
          Calcule seu IR mensal, anual e estimativa de restituição
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dependents">Número de dependentes</Label>
            <Input
              id="dependents"
              type="number"
              value={dependents}
              onChange={(e) => setDependents(Number(e.target.value))}
              min="0"
              max="10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medicalExpenses">Gastos médicos/ano (R$)</Label>
            <Input
              id="medicalExpenses"
              type="number"
              value={medicalExpenses}
              onChange={(e) => setMedicalExpenses(Number(e.target.value))}
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="educationExpenses">Gastos educação/ano (R$)</Label>
            <Input
              id="educationExpenses"
              type="number"
              value={educationExpenses}
              onChange={(e) => setEducationExpenses(Number(e.target.value))}
              min="0"
            />
          </div>

          {!getINSSFromPayroll(payrollData) && (
            <div className="space-y-2">
              <Label htmlFor="inssContribution">Desconto INSS mensal (R$)</Label>
              <Input
                id="inssContribution"
                type="number"
                value={inssContribution}
                onChange={(e) => setInssContribution(Number(e.target.value))}
                min="0"
                placeholder="Será calculado automaticamente"
              />
            </div>
          )}
        </div>

        <Button onClick={calculateIncomeTax} className="w-full">
          <Calculator className="h-4 w-4 mr-2" />
          Calcular Imposto de Renda
        </Button>

        {calculation && (
          <>
            <Separator />
            
            {/* Validação dos dados */}
            {(() => {
              const registeredIR = getIRFromPayroll(payrollData);
              const registeredINSS = getINSSFromPayroll(payrollData);
              const calculatedIR = calculateIRFromSalary(payrollData.grossSalary, registeredINSS, dependents);
              
              return (
                <div className="space-y-4">
                  {registeredIR > 0 && (
                    <div className={`p-4 rounded-lg ${Math.abs(registeredIR - calculatedIR) <= 20 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-yellow-50 dark:bg-yellow-500/10'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {Math.abs(registeredIR - calculatedIR) <= 20 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium">Validação do IR</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>IR do seu holerite: <span className="font-medium">{formatCurrency(registeredIR)}</span></div>
                        <div>IR calculado pela tabela: <span className="font-medium">{formatCurrency(calculatedIR)}</span></div>
                        {Math.abs(registeredIR - calculatedIR) <= 20 ? (
                          <div className="text-green-600 dark:text-green-400">✓ Valores estão consistentes</div>
                        ) : (
                          <div className="text-yellow-600 dark:text-yellow-400">⚠️ Diferença pode indicar dependentes ou outras deduções não consideradas</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {registeredINSS > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg">
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        💡 <strong>Usando dados do seu holerite:</strong> INSS de {formatCurrency(registeredINSS)} 
                        {registeredIR > 0 && ` e IR de ${formatCurrency(registeredIR)}`}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Resultados */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Resultados do Imposto de Renda</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    <span className="font-medium">IR Mensal</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.monthlyIR)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Faixa: {calculation.bracket}
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">IR Anual</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.yearlyIR)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPercentage(calculation.effectiveRate)} do salário
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Base de Cálculo</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculation.taxableIncome)}
                  </p>
                  <p className="text-sm text-blue-600/70">
                    Renda tributável anual
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  calculation.estimatedRefund > 0 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {calculation.estimatedRefund > 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {calculation.estimatedRefund > 0 ? 'Restituição Estimada' : 'Imposto a Pagar'}
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    calculation.estimatedRefund > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(calculation.estimatedRefund))}
                  </p>
                  <p className={`text-sm ${
                    calculation.estimatedRefund > 0 ? 'text-green-600/70' : 'text-red-600/70'
                  }`}>
                    {calculation.estimatedRefund > 0 ? 'A receber' : 'A complementar'}
                  </p>
                </div>
              </div>

              {/* Resumo das deduções */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3">📊 Resumo das Deduções</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Renda Bruta Anual:</span>
                    <span className="float-right font-medium">{formatCurrency(calculation.grossAnnualIncome)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">INSS (12 meses):</span>
                    <span className="float-right font-medium">{formatCurrency(inssContribution * 12)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dependentes ({dependents}):</span>
                    <span className="float-right font-medium">{formatCurrency(dependents * 189.59 * 12)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gastos Médicos:</span>
                    <span className="float-right font-medium">{formatCurrency(medicalExpenses)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gastos Educação:</span>
                    <span className="float-right font-medium">{formatCurrency(Math.min(educationExpenses, 3561.50 * 12))}</span>
                  </div>
                  <div className="border-t pt-2">
                    <span className="text-muted-foreground">Total Deduções:</span>
                    <span className="float-right font-bold">{formatCurrency(calculation.deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Tabela IR */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3">📋 Tabela IR 2024/2025 (Mensal)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Base de Cálculo</th>
                        <th className="text-left py-2">Alíquota</th>
                        <th className="text-left py-2">Dedução</th>
                        <th className="text-left py-2">Sua Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {irTable.map((bracket, index) => {
                        const taxableMonthly = calculation.taxableIncome / 12;
                        const isCurrentBracket = taxableMonthly >= bracket.min && taxableMonthly <= bracket.max;
                        
                        return (
                          <tr key={index} className="border-b">
                            <td className="py-2">
                              {bracket.max === Infinity 
                                ? `Acima de ${formatCurrency(bracket.min)}`
                                : `${formatCurrency(bracket.min)} - ${formatCurrency(bracket.max)}`
                              }
                            </td>
                            <td className="py-2">{formatPercentage(bracket.rate * 100)}</td>
                            <td className="py-2">{formatCurrency(bracket.deduction)}</td>
                            <td className="py-2">
                              {isCurrentBracket ? (
                                <span className="text-green-600 font-medium">Sua faixa</span>
                              ) : taxableMonthly > bracket.max ? (
                                <span className="text-blue-600">Já passou</span>
                              ) : (
                                <span className="text-gray-400">Acima da sua faixa</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informações importantes */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">ℹ️ Informações importantes:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Cálculo baseado na tabela 2024/2025 da Receita Federal</li>
                  <li>• Deduções: INSS, dependentes (R$ 189,59), saúde (ilimitado), educação (até R$ 3.561,50)</li>
                  <li>• Estimativa de restituição considera apenas IR na fonte vs IR devido</li>
                  <li>• Para declaração completa, considere outras rendas e deduções</li>
                  <li>• Consulte um contador para casos complexos</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}