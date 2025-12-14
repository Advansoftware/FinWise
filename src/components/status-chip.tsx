"use client";

import { Chip, ChipProps, useTheme, alpha } from "@mui/material";

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  value: string;
}

export function StatusChip({ value, sx, ...props }: StatusChipProps) {
  const theme = useTheme();
  
  // Determine status type for styling
  const getStatusColor = (val: string) => {
    switch (val) {
      case '0':
      case 'Email':
      case '48h':
        return 'default';
      case 'Básico':
        return 'default';
      case 'Pro':
      case '24h':
      case '100':
      case '12h':
        return 'info';
      case 'Plus':
      case '300':
      case 'Avançado':
        return 'secondary';
      case 'Infinity':
      case '500':
      case '4h':
      case '24/7':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const statusType = getStatusColor(value);

  // Custom styles based on status
  const getStyles = () => {
    if (statusType === 'default') {
      return {
        bgcolor: 'action.hover',
        color: 'text.secondary',
        borderColor: 'divider',
      };
    }
    
    // For colored chips, use the theme palette
    // logic similar to inline style but more robust
    const colorMain = statusType === 'info' ? theme.palette.info.main 
                    : statusType === 'secondary' ? theme.palette.secondary.main
                    : theme.palette.primary.main;
                    
    return {
      bgcolor: alpha(colorMain, 0.1),
      color: colorMain,
      borderColor: alpha(colorMain, 0.2),
    };
  };

  return (
    <Chip
      label={value}
      size="small"
      variant="outlined"
      {...props}
      sx={{
        fontWeight: 600,
        ...getStyles(),
        ...sx,
      }}
    />
  );
}
