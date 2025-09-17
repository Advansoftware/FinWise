'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Percent, Calendar, DollarSign } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface ConsignedLoanProps {
  payrollData: PayrollData;
}

interface LoanCalculation {
  availableMargin: number;
  maxLoanAmount: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  installments: LoanInstallment[];
}

interface LoanInstallment {
  number: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function ConsignedLoanCalculator({ payrollData }: ConsignedLoanProps) {
  const [mode, setMode] = useState<'payroll' | 'manual'>('payroll');
  const [manualData, setManualData] = useState<ManualSalaryData>({
    grossSalary: 0,
    netSalary: 0,
  });
  const [employeeType, setEmployeeType] = useState<'clt' | 'public' | 'inss'>('clt');
  const [loanAmount, setLoanAmount] = useState<number>(10000);
  const [interestRate, setInterestRate] = useState<number>(1.5);
  const [termMonths, setTermMonths] = useState<number>(60);
  const [currentLoans, setCurrentLoans] = useState<number>(0);
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  const hasPayrollData = payrollData.grossSalary > 0;
  const currentData = mode === 'payroll' ? payrollData : {
    ...payrollData,
    grossSalary: manualData.grossSalary,
    netSalary: manualData.netSalary,
  };

  // Margens consignáveis por tipo de trabalhador
  const getMarginRate = (type: string) => {
    switch (type) {
      case 'clt': return 0.30; // 30% para CLT
      case 'public': return 0.35; // 35% para servidor público
      case 'inss': return 0.45; // 45% para aposentado/pensionista
      default: return 0.30;
    }
  };

  const calculateLoan = () => {
    const netSalary = payrollData.netSalary;
    const marginRate = getMarginRate(employeeType);
    
    // Margem disponível
    const totalMargin = netSalary * marginRate;
    const availableMargin = Math.max(0, totalMargin - currentLoans);
    
    // Taxa mensal
    const monthlyRate = interestRate / 100;
    
    // Cálculo de parcela (Sistema SAC ou Price)
    const monthlyPayment = Math.min(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1),
      availableMargin
    );
    
    // Valor máximo do empréstimo baseado na margem disponível
    const maxLoanAmount = (availableMargin * (Math.pow(1 + monthlyRate, termMonths) - 1)) / 
                         (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
    
    // Simulação das parcelas
    const installments: LoanInstallment[] = [];
    let balance = loanAmount;
    let totalInterest = 0;
    
    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      totalInterest += interestPayment;
      
      installments.push({
        number: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }
    
    const totalAmount = loanAmount + totalInterest;

    setCalculation({
      availableMargin,
      maxLoanAmount,
      monthlyPayment,
      totalAmount,
      totalInterest,
      installments
    });
  };

  useEffect(() => {
    calculateLoan();
  }, [employeeType, loanAmount, termMonths, interestRate, currentLoans, payrollData.netSalary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getEmployeeTypeLabel = (type: string) => {
    switch (type) {
      case 'clt': return 'CLT (30% margem)';
      case 'public': return 'Servidor Público (35% margem)';
      case 'retired': return 'Aposentado/Pensionista (45% margem)';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Simulador de Empréstimo Consignado</CardTitle>
        </div>
        <CardDescription>
          Simule empréstimos com desconto direto na folha de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informação automática */}
        <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-blue-800 mb-2">📊 Dados extraídos do seu holerite:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-blue-600">Salário Bruto:</span>
              <span className="float-right font-medium">{formatCurrency(payrollData.grossSalary)}</span>
            </div>
            <div>
              <span className="text-blue-600">Salário Líquido:</span>
              <span className="float-right font-medium">{formatCurrency(payrollData.netSalary)}</span>
            </div>
            <div>
              <span className="text-blue-600">Margem Total ({formatPercentage(getMarginRate(employeeType) * 100)}):</span>
              <span className="float-right font-medium">{formatCurrency(payrollData.netSalary * getMarginRate(employeeType))}</span>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeType">Tipo de trabalhador</Label>
            <Select value={employeeType} onValueChange={(value: 'clt' | 'public' | 'inss') => setEmployeeType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clt">CLT - 30% margem</SelectItem>
                <SelectItem value="public">Servidor Público - 35% margem</SelectItem>
                <SelectItem value="inss">Aposentado/Pensionista - 45% margem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentLoans">Consignações atuais (R$)</Label>
            <Input
              id="currentLoans"
              type="number"
              value={currentLoans}
              onChange={(e) => setCurrentLoans(Number(e.target.value))}
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="loanAmount">Valor desejado (R$)</Label>
            <Input
              id="loanAmount"
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              min="1000"
              max="500000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="termMonths">Prazo (meses)</Label>
            <Input
              id="termMonths"
              type="number"
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
              min="6"
              max="96"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interestRate">Taxa de juros (% a.m.)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              min="0.5"
              max="5.0"
            />
          </div>
        </div>

        <Button onClick={calculateLoan} className="w-full">
          <CreditCard className="h-4 w-4 mr-2" />
          Simular Empréstimo
        </Button>

        {calculation && (
          <>
            <Separator />
            
            {/* Resultados */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Simulação - {getEmployeeTypeLabel(employeeType)}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Margem Disponível</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculation.availableMargin)}
                  </p>
                  <p className="text-sm text-blue-600/70">
                    Para novas consignações
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Valor Máximo</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculation.maxLoanAmount)}
                  </p>
                  <p className="text-sm text-green-600/70">
                    Com sua margem atual
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">Parcela Mensal</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.monthlyPayment)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {termMonths}x de {formatCurrency(calculation.monthlyPayment)}
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-primary" />
                    <span className="font-medium">Total de Juros</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(calculation.totalInterest)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(calculation.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Validação da margem */}
              {calculation.monthlyPayment > calculation.availableMargin && (
                <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">⚠️ Atenção</h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Valor da parcela excede a margem disponível. Reduza o valor ou aumente o prazo.
                  </p>
                </div>
              )}

              {/* Resumo financeiro */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3">💰 Resumo Financeiro</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Salário Líquido:</span>
                    <span className="float-right font-medium">{formatCurrency(payrollData.netSalary)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margem Total ({formatPercentage(getMarginRate(employeeType) * 100)}):</span>
                    <span className="float-right font-medium">{formatCurrency(payrollData.netSalary * getMarginRate(employeeType))}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Consignações Atuais:</span>
                    <span className="float-right font-medium">{formatCurrency(currentLoans)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margem Disponível:</span>
                    <span className="float-right font-medium">{formatCurrency(calculation.availableMargin)}</span>
                  </div>
                </div>
              </div>

              {/* Primeiras parcelas */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3">📋 Primeiras 6 Parcelas</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Parcela</th>
                        <th className="text-left py-2">Valor</th>
                        <th className="text-left py-2">Juros</th>
                        <th className="text-left py-2">Amortização</th>
                        <th className="text-left py-2">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.installments.slice(0, 6).map((installment) => (
                        <tr key={installment.number} className="border-b">
                          <td className="py-2">{installment.number}ª</td>
                          <td className="py-2">{formatCurrency(installment.payment)}</td>
                          <td className="py-2">{formatCurrency(installment.interest)}</td>
                          <td className="py-2">{formatCurrency(installment.principal)}</td>
                          <td className="py-2">{formatCurrency(installment.balance)}</td>
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
                  <li>• Desconto direto na folha de pagamento garante menores taxas</li>
                  <li>• Margem consignável: CLT (30%), Servidor (35%), Aposentado (45%)</li>
                  <li>• Taxas variam entre 1,5% a 3,5% a.m. dependendo do banco</li>
                  <li>• Simulação considera Sistema Price (parcelas fixas)</li>
                  <li>• Consulte seu banco para condições específicas</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}