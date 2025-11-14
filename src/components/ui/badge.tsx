'use client';

import * as React from "react"
import { Box, type SxProps, type Theme, useTheme } from '@mui/material';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  sx?: SxProps<Theme>;
}

const getVariantStyles = (variant: BadgeVariant = 'default', theme: Theme): SxProps<Theme> => {
  const styles: Record<BadgeVariant, SxProps<Theme>> = {
    default: {
      border: 'none',
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    secondary: {
      border: 'none',
      backgroundColor: theme.palette.custom.secondary,
      color: theme.palette.custom.secondaryForeground,
      '&:hover': {
        backgroundColor: `${theme.palette.custom.secondary}cc`,
      },
    },
    destructive: {
      border: 'none',
      backgroundColor: theme.palette.custom.destructive,
      color: theme.palette.custom.destructiveForeground,
      '&:hover': {
        backgroundColor: `${theme.palette.custom.destructive}cc`,
      },
    },
    outline: {
      border: `1px solid ${theme.palette.custom.border}`,
      backgroundColor: 'transparent',
      color: theme.palette.custom.foreground,
    },
  };
  
  return styles[variant];
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'default', children, sx, ...props }, ref) => {
    const theme = useTheme();
    
    return (
      <Box
        ref={ref}
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 'auto',
          padding: '2px 10px',
          fontSize: theme.typography.pxToRem(12),
          fontWeight: 600,
          borderRadius: '9999px',
          transition: theme.transitions.create(['background-color', 'box-shadow'], {
            duration: theme.transitions.duration.short,
          }),
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.custom.ring}`,
            outlineOffset: '2px',
          },
          ...getVariantStyles(variant, theme) as object,
          ...(typeof sx === 'function' ? sx(theme) : sx),
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

Badge.displayName = "Badge";

export { Badge }
export type { BadgeProps }
