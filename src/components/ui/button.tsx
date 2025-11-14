'use client';

import * as React from "react"
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled, type Theme, type SxProps } from '@mui/material/styles';
import { Slot } from "@radix-ui/react-slot"

// Mapeamento de variantes para o MUI
type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

// Helper para mapear variante para estilos
const getVariantStyles = (variant: ButtonVariant, theme: Theme): Record<string, any> => {
  const styles: Record<ButtonVariant, Record<string, any>> = {
    default: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: `rgba(${theme.palette.primary.main}, 0.9)`,
      },
    },
    destructive: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      '&:hover': {
        backgroundColor: `rgba(${theme.palette.error.main}, 0.9)`,
      },
    },
    outline: {
      border: `1px solid ${theme.palette.custom.input}`,
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.custom.accent,
        color: theme.palette.custom.accentForeground,
      },
    },
    secondary: {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
      '&:hover': {
        backgroundColor: `rgba(${theme.palette.secondary.main}, 0.8)`,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.custom.accent,
        color: theme.palette.custom.accentForeground,
      },
    },
    link: {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
      padding: 0,
      height: 'auto',
      minWidth: 'auto',
      '&:hover': {
        textDecoration: 'underline',
        backgroundColor: 'transparent',
      },
    },
  };

  return styles[variant];
};

const getSizeStyles = (size: ButtonSize, theme: Theme): Record<string, any> => {
  const styles: Record<ButtonSize, Record<string, any>> = {
    default: {
      height: '2.5rem',
      padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
    },
    sm: {
      height: '2.25rem',
      padding: `0 ${theme.spacing(3)}`,
    },
    lg: {
      height: '2.75rem',
      padding: `0 ${theme.spacing(8)}`,
    },
    icon: {
      height: '2.5rem',
      width: '2.5rem',
      padding: 0,
      minWidth: '2.5rem',
    },
  };

  return styles[size];
};

// Styled Button base
const StyledButton = styled(MuiButton)(({ theme }) => ({
  textTransform: 'none' as const,
  fontWeight: 500,
  fontSize: '0.875rem',
  borderRadius: theme.shape.borderRadius,
  gap: theme.spacing(2),
  transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color', 'color'], {
    duration: theme.transitions.duration.short,
  }),
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.custom.ring}`,
  },
  '&.Mui-disabled': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
  '& svg': {
    pointerEvents: 'none',
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
}));

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', asChild = false, children, sx, ...props }, ref) => {
    if (asChild) {
      // Se asChild, usar Slot do Radix
      return (
        <Slot ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    const combinedSx: SxProps<Theme> = (theme) => {
      const variantStyles = getVariantStyles(variant, theme);
      const sizeStyles = getSizeStyles(size, theme);
      const customSx = typeof sx === 'function' ? sx(theme) : sx || {};
      
      return {
        ...variantStyles,
        ...sizeStyles,
        ...(customSx as Record<string, any>),
      };
    };

    return (
      <StyledButton
        ref={ref}
        disableRipple={variant === 'link' || variant === 'ghost'}
        sx={combinedSx}
        {...props}
      >
        {children}
      </StyledButton>
    );
  }
);

Button.displayName = "Button"

// Função helper para compatibilidade com componentes que usam buttonVariants
export const buttonVariants = ({ variant = 'default', size = 'default' }: { variant?: ButtonVariant; size?: ButtonSize } = {}) => {
  // Esta é uma função helper para manter compatibilidade
  // Retorna um objeto que pode ser usado com className (embora não seja ideal no MUI)
  return {
    variant,
    size,
  };
};

export { Button }
export type { ButtonVariant, ButtonSize }
