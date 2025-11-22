// src/components/mui-wrappers/tooltip.tsx
// MUI wrapper para Tooltip
'use client';

import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material';
import { ReactElement, ReactNode } from 'react';

interface TooltipProps extends Omit<MuiTooltipProps, 'children'> {
  children: ReactElement;
}

export function Tooltip({ children, ...props }: TooltipProps) {
  return <MuiTooltip {...props}>{children}</MuiTooltip>;
}

interface TooltipTriggerProps {
  children: ReactElement;
  asChild?: boolean;
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  return <>{children}</>;
}

interface TooltipContentProps {
  children: ReactNode;
}

export function TooltipContent({ children }: TooltipContentProps) {
  return <>{children}</>;
}
