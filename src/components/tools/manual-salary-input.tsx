'use client';

import { TextField, Box, Stack, Typography, useTheme, alpha } from '@mui/material';
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
  const theme = useTheme();

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
    <Stack spacing={4} sx={{ p: 4, bgcolor: alpha(theme.palette.action.hover, 0.1), borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>Entrada Manual de Dados:</Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
        <TextField
          label="Salário Bruto (R$)"
          type="number"
          value={data.grossSalary || ''}
          onChange={(e) => handleGrossChange(e.target.value)}
          placeholder="Ex: 5000.00"
          inputProps={{ min: 0, step: 0.01 }}
          fullWidth
          size="small"
        />
        
        <TextField
          label="Salário Líquido (R$)"
          type="number"
          value={data.netSalary || ''}
          onChange={(e) => handleNetChange(e.target.value)}
          placeholder="Ex: 4200.00"
          inputProps={{ min: 0, step: 0.01 }}
          fullWidth
          size="small"
        />
      </Box>
      
      {data.grossSalary > 0 && data.netSalary > 0 && (
        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: alpha(theme.palette.info.main, 0.1), p: 2, borderRadius: 1, border: 1, borderColor: alpha(theme.palette.info.main, 0.2) }}>
          <Typography component="strong" fontWeight="bold">Resumo:</Typography> Bruto: {formatCurrency(data.grossSalary)} | 
          Líquido: {formatCurrency(data.netSalary)} | 
          Desconto: {formatCurrency(data.grossSalary - data.netSalary)} ({((data.grossSalary - data.netSalary) / data.grossSalary * 100).toFixed(1)}%)
        </Box>
      )}
    </Stack>
  );
}