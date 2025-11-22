'use client';

import {Button, Chip, Stack, Typography, useTheme, alpha} from '@mui/material';
import { FileText, Edit3 } from "lucide-react";

interface CalculatorModeToggleProps {
  mode: 'payroll' | 'manual';
  onModeChange: (mode: 'payroll' | 'manual') => void;
  hasPayrollData?: boolean;
}

export function CalculatorModeToggle({ mode, onModeChange, hasPayrollData = true }: CalculatorModeToggleProps) {
  const theme = useTheme();
  
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 3, bgcolor: alpha(theme.palette.action.hover, 0.1), borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>Modo de Cálculo:</Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant={mode === 'payroll' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onModeChange('payroll')}
          disabled={!hasPayrollData}
          startIcon={<FileText size={16} />}
          sx={{ fontSize: '0.75rem' }}
        >
          Holerite
          {!hasPayrollData && <Chip label="Sem dados" size="small" color="error" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} />}
        </Button>
        <Button
          variant={mode === 'manual' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onModeChange('manual')}
          startIcon={<Edit3 size={16} />}
          sx={{ fontSize: '0.75rem' }}
        >
          Manual
        </Button>
      </Stack>
    </Stack>
  );
}