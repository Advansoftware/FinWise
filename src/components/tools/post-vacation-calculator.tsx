'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Calculator } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getConsignedLoanFromPayroll } from "@/lib/payroll-utils";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface PostVacationCalculatorProps {
  payrollData: PayrollData;
}

export function PostVacationCalculator({ payrollData }: PostVacationCalculatorProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [vacationDays, setVacationDays] = useState(30);
  const [result, setResult] = useState<{
    normalSalary: number;
    vacationValue: number;
    vacationDiscount: number;
    daysWorkedAfterVacation: number;
    proportionalSalary: number;
    detailedDiscounts: {
      inss: number;
      ir: number;
      otherDiscounts: { name: string; amount: number }[];
    };
    consignedDiscount: number;
    grossPayroll: number;
    totalDiscounts: number;
    netPayroll: number;
  } | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  const calculatePostVacation = () => {
    // Salário base mensal
    const normalSalary = currentData.grossSalary;
    
    // Valor das férias que foi recebido antecipadamente (só para informação)
    const dailySalary = normalSalary / 30;
    const vacationSalary = dailySalary * vacationDays;
    const oneThirdBonus = vacationSalary / 3;
    const vacationValue = vacationSalary + oneThirdBonus;
    
    // ✅ LÓGICA CORRETA: No mês pós-férias
    // 1. Você recebe o salário normal (30 dias)
    // 2. É descontado apenas os dias que você NÃO trabalhou (férias)
    // 3. Resultado = dias trabalhados no mês
    
    const daysNotWorked = vacationDays; // Dias de férias = dias não trabalhados
    const daysWorked = 30 - daysNotWorked; // Dias efetivamente trabalhados
    
    // Desconto dos dias não trabalhados
    const discountForDaysNotWorked = (normalSalary / 30) * daysNotWorked;
    
    // Valor bruto do holerite = salário normal - dias não trabalhados
    const grossPayroll = normalSalary - discountForDaysNotWorked;
    
    // Cálculo dos descontos proporcionais aos dias trabalhados
    let detailedDiscounts = { inss: 0, ir: 0, otherDiscounts: [] as { name: string; amount: number }[] };
    let consignedDiscount = 0;
    
    if (mode === 'payroll') {
      const workProportion = daysWorked / 30; // Proporção dos dias trabalhados
      
      // Buscar descontos específicos na lista de descontos
      const inssDiscount = payrollData.discounts.find(d => 
        d.type === 'discount' && d.name.toLowerCase().includes('inss')
      );
      const irDiscount = payrollData.discounts.find(d => 
        d.type === 'discount' && (d.name.toLowerCase().includes('imposto') || d.name.toLowerCase().includes('renda'))
      );
      
      // INSS proporcional
      detailedDiscounts.inss = (inssDiscount?.amount || 0) * workProportion;
      
      // IR proporcional
      detailedDiscounts.ir = (irDiscount?.amount || 0) * workProportion;
      
      // Outros descontos proporcionais (exceto INSS, IR e empréstimo consignado)
      const otherDiscountsList = payrollData.discounts
        .filter(d => 
          d.type === 'discount' && 
          !d.name.toLowerCase().includes('inss') &&
          !d.name.toLowerCase().includes('imposto') &&
          !d.name.toLowerCase().includes('renda') &&
          !d.name.toLowerCase().includes('consignado') &&
          !d.name.toLowerCase().includes('empréstimo') &&
          !d.name.toLowerCase().includes('emprestimo')
        )
        .map(d => ({ name: d.name, amount: d.amount * workProportion }));
      
      detailedDiscounts.otherDiscounts = otherDiscountsList;
      
      // Empréstimo consignado (valor fixo, independente das férias)
      consignedDiscount = getConsignedLoanFromPayroll(payrollData);
    } else {
      // Para entrada manual
      const discountRate = currentData.grossSalary > 0 
        ? (currentData.grossSalary - currentData.netSalary) / currentData.grossSalary 
        : 0;
      const totalManualDiscounts = grossPayroll * discountRate;
      // Estimar proporções para entrada manual
      detailedDiscounts.inss = totalManualDiscounts * 0.4; // ~40% geralmente é INSS
      detailedDiscounts.ir = totalManualDiscounts * 0.3; // ~30% geralmente é IR
      detailedDiscounts.otherDiscounts = [{ name: 'Outros Descontos Estimados', amount: totalManualDiscounts * 0.3 }];
    }
    
    const normalDiscountsTotal = detailedDiscounts.inss + detailedDiscounts.ir + 
      detailedDiscounts.otherDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
    const totalDiscounts = normalDiscountsTotal + consignedDiscount;
    const netPayroll = grossPayroll - totalDiscounts;

    setResult({
      normalSalary,
      vacationValue,
      vacationDiscount: discountForDaysNotWorked,
      daysWorkedAfterVacation: daysWorked,
      proportionalSalary: grossPayroll,
      detailedDiscounts,
      consignedDiscount,
      grossPayroll,
      totalDiscounts,
      netPayroll,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora Pós-Férias</CardTitle>
        </div>
        <CardDescription>
          Calcule como ficará seu salário no mês de retorno das férias (5º dia útil).
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
            <div className="text-sm font-medium">Dados do Holerite Utilizados:</div>
            
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
                    ✓ Valor fixo mensal (não afetado pelas férias)
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ManualSalaryInput data={manualData} onChange={setManualData} />
        )}

        {/* Parâmetros das férias */}
        <div className="space-y-2">
          <Label htmlFor="vacationDays">Dias de Férias Tirados</Label>
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
            Dias que você não trabalhou no mês (máximo: 30)
          </div>
        </div>

        <Button 
          onClick={calculatePostVacation} 
          className="w-full"
          disabled={(mode === 'manual' && (manualData.grossSalary <= 0 || manualData.netSalary <= 0)) || 
                   (mode === 'payroll' && !hasPayrollData)}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calcular Salário Pós-Férias
        </Button>

        {/* Resultado */}
        {result && (
          <div className="space-y-3 pt-4 border-t">
            <div className="text-sm font-medium">Simulação do Holerite Pós-Férias:</div>
            
            <div className="space-y-3">
              {/* Valores base */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">📋 Composição do Holerite:</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Salário normal (30 dias):</span>
                  <Badge variant="outline" className="text-xs">
                    {formatCurrency(result.normalSalary)}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Desconto pelos {vacationDays} dias não trabalhados:</span>
                  <Badge variant="outline" className="text-red-600 text-xs">
                    -{formatCurrency(result.vacationDiscount)}
                  </Badge>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Valor pelos {result.daysWorkedAfterVacation} dias trabalhados:</span>
                    <Badge variant="outline" className="font-bold text-xs">
                      {formatCurrency(result.grossPayroll)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Descontos */}
              <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-lg space-y-2">
                <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">💸 Descontos Aplicados (Proporcionais):</div>
                
                {result.detailedDiscounts.inss > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">INSS:</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(result.detailedDiscounts.inss)}
                    </Badge>
                  </div>
                )}
                
                {result.detailedDiscounts.ir > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Imposto de Renda:</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(result.detailedDiscounts.ir)}
                    </Badge>
                  </div>
                )}
                
                {result.detailedDiscounts.otherDiscounts.map((discount, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{discount.name}:</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(discount.amount)}
                    </Badge>
                  </div>
                ))}
                
                {result.consignedDiscount > 0 && (
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-xs text-muted-foreground">Empréstimo consignado (valor fixo):</span>
                    <Badge variant="outline" className="text-red-600 text-xs">
                      -{formatCurrency(result.consignedDiscount)}
                    </Badge>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Total dos descontos:</span>
                    <Badge variant="outline" className="text-red-600 font-bold text-xs">
                      -{formatCurrency(result.totalDiscounts)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Resultado final */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Salário Líquido Pós-Férias:</span>
                <Badge className={result.netPayroll >= 0 ? "bg-green-600 dark:bg-green-600 text-white font-bold" : "bg-red-600 dark:bg-red-600 text-white font-bold"}>
                  {formatCurrency(result.netPayroll)}
                </Badge>
              </div>

              {/* Informações importantes */}
              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border border-blue-200 dark:border-blue-500/20">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  💡 Como Funciona o Cálculo:
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Você recebe o salário normal de 30 dias: {formatCurrency(result.normalSalary)}</div>
                  <div>• É descontado apenas os {vacationDays} dias que NÃO trabalhou: -{formatCurrency(result.vacationDiscount)}</div>
                  <div>• Sobram os {result.daysWorkedAfterVacation} dias que você trabalhou: {formatCurrency(result.grossPayroll)}</div>
                  <div>• Descontos são aplicados proporcionalmente aos dias trabalhados</div>
                  <div>• Empréstimo consignado continua o valor fixo do holerite</div>
                  {result.netPayroll >= 0 ? (
                    <div className="text-green-600 dark:text-green-400 font-medium mt-2">
                      ✅ Resultado positivo: você receberá {formatCurrency(result.netPayroll)}
                    </div>
                  ) : (
                    <div className="text-red-600 dark:text-red-400 font-medium mt-2">
                      ⚠️ Resultado negativo: você deve {formatCurrency(Math.abs(result.netPayroll))} para a empresa
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-500/10 p-2 rounded border border-blue-200 dark:border-blue-500/20">
              <strong>Nota:</strong> {mode === 'payroll' 
                ? `Cálculo baseado na lógica correta: você recebe apenas pelos dias trabalhados no mês. Descontos (INSS, IR, etc.) são calculados proporcionalmente baseados nos valores do seu holerite. Empréstimo consignado mantém valor fixo.`
                : 'Estimativa baseada na proporção de descontos informada. Para cálculos mais precisos, use os dados do holerite.'
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}