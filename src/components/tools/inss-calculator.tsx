'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock, DollarSign, Users, AlertCircle, CheckCircle } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { getINSSFromPayroll, calculateINSSFromSalary, validatePayrollData } from "@/lib/payroll-utils";

interface INSSCalculatorProps {
  payrollData: PayrollData;
}

interface INSSCalculation {
  monthlyContribution: number;
  yearlyContribution: number;
  contributionRate: number;
  yearsToRetirement: number;
  estimatedBenefit: number;
  totalContributed: number;
}

export function INSSCalculator({ payrollData }: INSSCalculatorProps) {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [contributionYears, setContributionYears] = useState<number>(5);
  const [calculation, setCalculation] = useState<INSSCalculation | null>(null);

  // Tabela INSS 2024/2025
  const inssTable = [
    { min: 0, max: 1412.00, rate: 0.075 },
    { min: 1412.01, max: 2666.68, rate: 0.09 },
    { min: 2666.69, max: 4000.03, rate: 0.12 },
    { min: 4000.04, max: 7786.02, rate: 0.14 }
  ];

  const calculateINSS = () => {
    const grossSalary = payrollData.grossSalary;
    
    // Usar INSS real do holerite
    const registeredINSS = getINSSFromPayroll(payrollData);
    const calculatedINSS = calculateINSSFromSalary(grossSalary);
    
    // Usar o INSS registrado se disponível, senão o calculado
    const monthlyContribution = registeredINSS || calculatedINSS;
    
    const effectiveRate = (monthlyContribution / grossSalary) * 100;
    const yearlyContribution = monthlyContribution * 12;

    // Regras de aposentadoria (regra de pontos - 2024)
    const minAgeWomen = 62;
    const minAgeMen = 65;
    const minContributionTime = 20; // anos mínimos de contribuição para mulheres
    const minContributionTimeMen = 20; // anos mínimos de contribuição para homens
    
    // Assumindo sexo masculino para cálculo padrão (pode ser parametrizado)
    const retirementAge = minAgeMen;
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const totalContributionYears = contributionYears + yearsToRetirement;

    // Estimativa simplificada do benefício (média dos 80% maiores salários)
    // Fator previdenciário simplificado
    const averageSalary = grossSalary; // Simplificação
    const replacementRate = Math.min(0.6 + (totalContributionYears - minContributionTimeMen) * 0.02, 1);
    const estimatedBenefit = Math.min(averageSalary * replacementRate, 7786.02);

    const totalContributed = monthlyContribution * totalContributionYears * 12;

    setCalculation({
      monthlyContribution,
      yearlyContribution,
      contributionRate: effectiveRate,
      yearsToRetirement,
      estimatedBenefit,
      totalContributed
    });
  };

  useEffect(() => {
    calculateINSS();
  }, [currentAge, contributionYears, payrollData.grossSalary]);

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
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de INSS</CardTitle>
        </div>
        <CardDescription>
          Calcule sua contribuição previdenciária e estimativa de aposentadoria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentAge">Idade atual</Label>
            <Input
              id="currentAge"
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              min="18"
              max="70"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contributionYears">Anos já contribuídos</Label>
            <Input
              id="contributionYears"
              type="number"
              value={contributionYears}
              onChange={(e) => setContributionYears(Number(e.target.value))}
              min="0"
              max="50"
            />
          </div>
        </div>

        <Button onClick={calculateINSS} className="w-full">
          <Shield className="h-4 w-4 mr-2" />
          Calcular INSS
        </Button>

        {calculation && (
          <>
            <Separator />
            
            {/* Validação dos dados */}
            {(() => {
              const registeredINSS = getINSSFromPayroll(payrollData);
              const calculatedINSS = calculateINSSFromSalary(payrollData.grossSalary);
              const validation = validatePayrollData(payrollData);
              
              return (
                <div className="space-y-4">
                  {registeredINSS > 0 && (
                    <div className={`p-4 rounded-lg ${Math.abs(registeredINSS - calculatedINSS) <= 10 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-yellow-50 dark:bg-yellow-500/10'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {Math.abs(registeredINSS - calculatedINSS) <= 10 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium">Validação do INSS</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>INSS do seu holerite: <span className="font-medium">{formatCurrency(registeredINSS)}</span></div>
                        <div>INSS calculado pela tabela: <span className="font-medium">{formatCurrency(calculatedINSS)}</span></div>
                        {Math.abs(registeredINSS - calculatedINSS) <= 10 ? (
                          <div className="text-green-600 dark:text-green-400">✓ Valores estão consistentes</div>
                        ) : (
                          <div className="text-yellow-600 dark:text-yellow-400">⚠️ Diferença de {formatCurrency(Math.abs(registeredINSS - calculatedINSS))} - verifique seus dados</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Resultados */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Resultados do INSS</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium">Contribuição Mensal</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.monthlyContribution)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPercentage(calculation.contributionRate)} do salário
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">Contribuição Anual</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.yearlyContribution)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valor total no ano
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Anos para Aposentadoria</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {calculation.yearsToRetirement}
                  </p>
                  <p className="text-sm text-blue-600/70">
                    Baseado na idade mínima (65 anos)
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Benefício Estimado</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculation.estimatedBenefit)}
                  </p>
                  <p className="text-sm text-green-600/70">
                    Aposentadoria mensal estimada
                  </p>
                </div>
              </div>

              {/* Tabela INSS */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3">📊 Tabela INSS 2024/2025</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Faixa Salarial</th>
                        <th className="text-left py-2">Alíquota</th>
                        <th className="text-left py-2">Sua Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inssTable.map((bracket, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">
                            {formatCurrency(bracket.min)} - {formatCurrency(bracket.max)}
                          </td>
                          <td className="py-2">{formatPercentage(bracket.rate * 100)}</td>
                          <td className="py-2">
                            {payrollData.grossSalary >= bracket.min && payrollData.grossSalary <= bracket.max ? (
                              <span className="text-green-600 font-medium">Sua faixa</span>
                            ) : payrollData.grossSalary > bracket.max ? (
                              <span className="text-blue-600">Já passou</span>
                            ) : (
                              <span className="text-gray-400">Acima da sua faixa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informações importantes */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">ℹ️ Informações importantes:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Contribuição obrigatória descontada do salário bruto</li>
                  <li>• Idade mínima: 65 anos (homens) / 62 anos (mulheres)</li>
                  <li>• Tempo mínimo de contribuição: 20 anos</li>
                  <li>• Teto do INSS: {formatCurrency(7786.02)} (2024)</li>
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