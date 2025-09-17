'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, AlertTriangle, DollarSign, FileText } from "lucide-react";
import { PayrollData } from "@/lib/types";
import { CalculatorModeToggle } from "./calculator-mode-toggle";
import { ManualSalaryInput, ManualSalaryData } from "./manual-salary-input";

interface SeveranceCalculatorProps {
  payrollData: PayrollData;
}

interface SeveranceCalculation {
  avisoPrevia: number;
  salarioAviso: number;
  feriasPendentes: number;
  decimoTerceiro: number;
  fgtsBalance: number;
  fgtsFine: number;
  totalReceive: number;
  rescissionType: string;
}

type RescissionType = 'demissao-sem-justa-causa' | 'demissao-com-justa-causa' | 'pedido-demissao' | 'comum-acordo';

export function SeveranceCalculator({ payrollData }: SeveranceCalculatorProps) {
  const [workMonths, setWorkMonths] = useState<number>(12);
  const [vacationDays, setVacationDays] = useState<number>(30);
  const [rescissionType, setRescissionType] = useState<RescissionType>('demissao-sem-justa-causa');
  const [fgtsBalance, setFgtsBalance] = useState<number>(5000);
  const [calculation, setCalculation] = useState<SeveranceCalculation | null>(null);

  const calculateSeverance = () => {
    const dailySalary = payrollData.grossSalary / 30;
    
    let avisoPrevia = 0;
    let salarioAviso = 0;
    let feriasPendentes = 0;
    let decimoTerceiro = 0;
    let fgtsFine = 0;

    // Cálculo baseado no tipo de rescisão
    switch (rescissionType) {
      case 'demissao-sem-justa-causa':
        // Aviso prévio (30 dias + 3 dias por ano trabalhado, máximo 90 dias)
        const yearsWorked = Math.floor(workMonths / 12);
        const noticeDays = Math.min(30 + (yearsWorked * 3), 90);
        avisoPrevia = noticeDays;
        salarioAviso = dailySalary * noticeDays;
        
        // Férias proporcionais + 1/3
        feriasPendentes = (dailySalary * vacationDays) * 1.333;
        
        // 13º salário proporcional
        decimoTerceiro = (payrollData.grossSalary / 12) * (workMonths % 12);
        
        // Multa FGTS 40%
        fgtsFine = fgtsBalance * 0.4;
        break;

      case 'demissao-com-justa-causa':
        // Apenas saldo de salário e férias vencidas (se houver)
        feriasPendentes = vacationDays > 30 ? (dailySalary * (vacationDays - 30)) * 1.333 : 0;
        break;

      case 'pedido-demissao':
        // Férias proporcionais + 1/3 e 13º proporcional
        feriasPendentes = (dailySalary * vacationDays) * 1.333;
        decimoTerceiro = (payrollData.grossSalary / 12) * (workMonths % 12);
        // Sem multa FGTS e pode sacar apenas em casos específicos
        break;

      case 'comum-acordo':
        // 50% do aviso prévio, férias + 1/3, 13º proporcional, multa FGTS 20%
        const noticeAgreement = Math.min(30 + (Math.floor(workMonths / 12) * 3), 90);
        avisoPrevia = noticeAgreement / 2;
        salarioAviso = (dailySalary * noticeAgreement) / 2;
        feriasPendentes = (dailySalary * vacationDays) * 1.333;
        decimoTerceiro = (payrollData.grossSalary / 12) * (workMonths % 12);
        fgtsFine = fgtsBalance * 0.2;
        break;
    }

    const totalReceive = salarioAviso + feriasPendentes + decimoTerceiro + fgtsFine;

    setCalculation({
      avisoPrevia,
      salarioAviso,
      feriasPendentes,
      decimoTerceiro,
      fgtsBalance,
      fgtsFine,
      totalReceive,
      rescissionType
    });
  };

  useEffect(() => {
    calculateSeverance();
  }, [workMonths, vacationDays, rescissionType, fgtsBalance, payrollData.grossSalary]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRescissionTitle = (type: RescissionType) => {
    const titles = {
      'demissao-sem-justa-causa': 'Demissão sem Justa Causa',
      'demissao-com-justa-causa': 'Demissão com Justa Causa',
      'pedido-demissao': 'Pedido de Demissão',
      'comum-acordo': 'Comum Acordo'
    };
    return titles[type];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Rescisão</CardTitle>
        </div>
        <CardDescription>
          Calcule os valores da rescisão trabalhista conforme a CLT
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
              <span className="text-blue-600">Salário Diário:</span>
              <span className="float-right font-medium">{formatCurrency(payrollData.grossSalary / 30)}</span>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rescissionType">Tipo de rescisão</Label>
            <Select value={rescissionType} onValueChange={(value: RescissionType) => setRescissionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demissao-sem-justa-causa">Demissão sem Justa Causa</SelectItem>
                <SelectItem value="demissao-com-justa-causa">Demissão com Justa Causa</SelectItem>
                <SelectItem value="pedido-demissao">Pedido de Demissão</SelectItem>
                <SelectItem value="comum-acordo">Comum Acordo (Art. 484-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workMonths">Meses trabalhados</Label>
            <Input
              id="workMonths"
              type="number"
              value={workMonths}
              onChange={(e) => setWorkMonths(Number(e.target.value))}
              min="1"
              max="600"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vacationDays">Dias de férias pendentes</Label>
            <Input
              id="vacationDays"
              type="number"
              value={vacationDays}
              onChange={(e) => setVacationDays(Number(e.target.value))}
              min="0"
              max="60"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fgtsBalance">Saldo FGTS (R$)</Label>
            <Input
              id="fgtsBalance"
              type="number"
              value={fgtsBalance}
              onChange={(e) => setFgtsBalance(Number(e.target.value))}
              min="0"
            />
          </div>
        </div>

        <Button onClick={calculateSeverance} className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Calcular Rescisão
        </Button>

        {calculation && (
          <>
            <Separator />
            
            {/* Resultados */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Rescisão: {getRescissionTitle(rescissionType)}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calculation.salarioAviso > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Aviso Prévio</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculation.salarioAviso)}
                    </p>
                    <p className="text-sm text-blue-600/70">
                      {calculation.avisoPrevia} dias
                    </p>
                  </div>
                )}

                {calculation.feriasPendentes > 0 && (
                  <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Férias + 1/3</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculation.feriasPendentes)}
                    </p>
                    <p className="text-sm text-green-600/70">
                      {vacationDays} dias pendentes
                    </p>
                  </div>
                )}

                {calculation.decimoTerceiro > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">13º Proporcional</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(calculation.decimoTerceiro)}
                    </p>
                    <p className="text-sm text-purple-600/70">
                      {workMonths % 12} meses
                    </p>
                  </div>
                )}

                {calculation.fgtsFine > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Multa FGTS</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(calculation.fgtsFine)}
                    </p>
                    <p className="text-sm text-orange-600/70">
                      {rescissionType === 'comum-acordo' ? '20%' : '40%'} do saldo
                    </p>
                  </div>
                )}

                <div className="bg-primary/10 p-4 rounded-lg md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium">Total a Receber</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(calculation.totalReceive)}
                  </p>
                  <p className="text-sm text-primary/70">
                    Valor bruto (antes dos descontos)
                  </p>
                </div>
              </div>

              {/* Informações específicas por tipo */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">ℹ️ Informações sobre {getRescissionTitle(rescissionType)}:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {rescissionType === 'demissao-sem-justa-causa' && (
                    <>
                      <li>• Direito a seguro-desemprego (se elegível)</li>
                      <li>• Saque total do FGTS + multa de 40%</li>
                      <li>• Aviso prévio: 30 dias + 3 dias por ano trabalhado</li>
                      <li>• Desconto de INSS e IR sobre verbas rescisórias</li>
                    </>
                  )}
                  {rescissionType === 'demissao-com-justa-causa' && (
                    <>
                      <li>• Sem direito a seguro-desemprego</li>
                      <li>• Sem direito ao FGTS e multa</li>
                      <li>• Apenas saldo de salário e férias vencidas</li>
                      <li>• Justa causa deve ser comprovada pelo empregador</li>
                    </>
                  )}
                  {rescissionType === 'pedido-demissao' && (
                    <>
                      <li>• Sem direito a seguro-desemprego</li>
                      <li>• Sem direito à multa do FGTS</li>
                      <li>• FGTS pode ser sacado apenas em casos específicos</li>
                      <li>• Aviso prévio pode ser dispensado pelo empregador</li>
                    </>
                  )}
                  {rescissionType === 'comum-acordo' && (
                    <>
                      <li>• 50% do aviso prévio e multa FGTS (20%)</li>
                      <li>• Pode sacar até 80% do FGTS</li>
                      <li>• Sem direito a seguro-desemprego</li>
                      <li>• Modalidade criada pela Lei 13.467/2017</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}