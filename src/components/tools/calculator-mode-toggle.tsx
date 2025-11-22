'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit3 } from "lucide-react";
import { Box, Stack, Typography } from '@mui/material';

interface CalculatorModeToggleProps {
  mode: 'payroll' | 'manual';
  onModeChange: (mode: 'payroll' | 'manual') => void;
  hasPayrollData?: boolean;
}

export function CalculatorModeToggle({ mode, onModeChange, hasPayrollData = true }: CalculatorModeToggleProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>Modo de Cálculo:</Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant={mode === 'payroll' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('payroll')}
          disabled={!hasPayrollData}
          sx={{ fontSize: '0.75rem' }}
        >
          <FileText style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
          Holerite
          {!hasPayrollData && <Badge variant="destructive" sx={{ ml: 1, fontSize: '0.75rem' }}>Sem dados</Badge>}
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('manual')}
          sx={{ fontSize: '0.75rem' }}
        >
          <Edit3 style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
          Manual
        </Button>
      </Stack>
    </Stack>
  );
}