'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

export interface ManualSalaryData {
  grossSalary: number;
  netSalary: number;
}

interface ManualSalaryInputProps {
  data: ManualSalaryData;
  onChange: (data: ManualSalaryData) => void;
}

export function ManualSalaryInput({ data, onChange }: ManualSalaryInputProps) {
  const handleGrossChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...data,
      grossSalary: numValue,
    });
  };

  const handleNetChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...data,
      netSalary: numValue,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 dark:bg-muted/10 rounded-lg border">
      <div className="text-sm font-medium text-muted-foreground">Entrada Manual de Dados:</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grossSalary" className="text-sm">
            Salário Bruto (R$)
          </Label>
          <Input
            id="grossSalary"
            type="number"
            step="0.01"
            min="0"
            value={data.grossSalary || ''}
            onChange={(e) => handleGrossChange(e.target.value)}
            placeholder="Ex: 5000.00"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="netSalary" className="text-sm">
            Salário Líquido (R$)
          </Label>
          <Input
            id="netSalary"
            type="number"
            step="0.01"
            min="0"
            value={data.netSalary || ''}
            onChange={(e) => handleNetChange(e.target.value)}
            placeholder="Ex: 4200.00"
            className="text-sm"
          />
        </div>
      </div>
      
      {data.grossSalary > 0 && data.netSalary > 0 && (
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-500/10 p-2 rounded border">
          <strong>Resumo:</strong> Bruto: {formatCurrency(data.grossSalary)} | 
          Líquido: {formatCurrency(data.netSalary)} | 
          Desconto: {formatCurrency(data.grossSalary - data.netSalary)} ({((data.grossSalary - data.netSalary) / data.grossSalary * 100).toFixed(1)}%)
        </div>
      )}
    </div>
  );
}