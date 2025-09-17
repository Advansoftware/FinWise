'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit3 } from "lucide-react";

interface CalculatorModeToggleProps {
  mode: 'payroll' | 'manual';
  onModeChange: (mode: 'payroll' | 'manual') => void;
  hasPayrollData?: boolean;
}

export function CalculatorModeToggle({ mode, onModeChange, hasPayrollData = true }: CalculatorModeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 dark:bg-muted/10 rounded-lg border">
      <div className="text-sm font-medium text-muted-foreground">Modo de Cálculo:</div>
      <div className="flex gap-1">
        <Button
          variant={mode === 'payroll' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('payroll')}
          disabled={!hasPayrollData}
          className="text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          Holerite
          {!hasPayrollData && <Badge variant="destructive" className="ml-1 text-xs">Sem dados</Badge>}
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('manual')}
          className="text-xs"
        >
          <Edit3 className="h-3 w-3 mr-1" />
          Manual
        </Button>
      </div>
    </div>
  );
}