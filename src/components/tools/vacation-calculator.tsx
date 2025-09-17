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

interface VacationCalculatorProps {
  payrollData: PayrollData;
}

export function VacationCalculator({ payrollData }: VacationCalculatorProps) {
  const [vacationDays, setVacationDays] = useState(30);
  const [result, setResult] = useState<{
    vacationSalary: number;
    oneThirdBonus: number;
    total: number;
  } | null>(null);

  const calculateVacation = () => {
    // Cálculo baseado no salário bruto
    const dailySalary = payrollData.grossSalary / 30;
    const vacationSalary = dailySalary * vacationDays;
    const oneThirdBonus = vacationSalary / 3; // 1/3 constitucional
    const total = vacationSalary + oneThirdBonus;

    setResult({
      vacationSalary,
      oneThirdBonus,
      total,
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
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total a Receber:</span>
                <Badge className="bg-green-600 text-white font-bold">
                  {formatCurrency(result.total)}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              <strong>Nota:</strong> Este cálculo é baseado no salário bruto e não inclui descontos como INSS e IR que podem incidir sobre as férias.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}