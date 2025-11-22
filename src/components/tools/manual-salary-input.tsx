'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Box, Stack, Typography } from '@mui/material';

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
    <Stack spacing={4} sx={{ p: 4, bgcolor: 'action.hover', borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>Entrada Manual de Dados:</Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
        <Stack spacing={2}>
          <Label htmlFor="grossSalary" sx={{ fontSize: '0.875rem' }}>
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
            sx={{ fontSize: '0.875rem' }}
          />
        </Stack>
        
        <Stack spacing={2}>
          <Label htmlFor="netSalary" sx={{ fontSize: '0.875rem' }}>
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
            sx={{ fontSize: '0.875rem' }}
          />
        </Stack>
      </Box>
      
      {data.grossSalary > 0 && data.netSalary > 0 && (
        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Typography component="strong">Resumo:</Typography> Bruto: {formatCurrency(data.grossSalary)} | 
          Líquido: {formatCurrency(data.netSalary)} | 
          Desconto: {formatCurrency(data.grossSalary - data.netSalary)} ({((data.grossSalary - data.netSalary) / data.grossSalary * 100).toFixed(1)}%)
        </Box>
      )}
    </Stack>
  );
}