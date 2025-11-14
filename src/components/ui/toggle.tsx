"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

type ToggleVariant = 'default' | 'outline'
type ToggleSize = 'default' | 'sm' | 'lg'

const StyledToggle = styled(TogglePrimitive.Root, {
  shouldForwardProp: (prop) => prop !== 'toggleVariant' && prop !== 'toggleSize',
})<{ toggleVariant?: ToggleVariant; toggleSize?: ToggleSize }>(({ theme, toggleVariant = 'default', toggleSize = 'default' }) => {
  const sizeStyles = {
    default: {
      height: '2.5rem',
      padding: theme.spacing(0, 3),
    },
    sm: {
      height: '2.25rem',
      padding: theme.spacing(0, 2.5),
    },
    lg: {
      height: '2.75rem',
      padding: theme.spacing(0, 5),
    },
  }
  
  const variantStyles = {
    default: {
      backgroundColor: 'transparent',
    },
    outline: {
      border: `1px solid ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.input : (theme.palette as any).custom?.input}`,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accent : (theme.palette as any).custom?.accent,
        color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accentForeground : (theme.palette as any).custom?.accentForeground,
      },
    },
  }
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.borderRadius,
    fontSize: theme.typography.pxToRem(14),
    fontWeight: theme.typography.fontWeightMedium,
    transition: theme.transitions.create(['background-color', 'color', 'box-shadow']),
    
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.muted : (theme.palette as any).custom?.muted,
      color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.mutedForeground : (theme.palette as any).custom?.mutedForeground,
    },
    
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.ring + '33' : (theme.palette as any).custom?.ring + '33'}`,
    },
    
    '&:disabled': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
    
    '&[data-state=on]': {
      backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accent : (theme.palette as any).custom?.accent,
      color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accentForeground : (theme.palette as any).custom?.accentForeground,
    },
    
    ...sizeStyles[toggleSize],
    ...variantStyles[toggleVariant],
  }
})

interface ToggleProps extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  variant?: ToggleVariant;
  size?: ToggleSize;
  sx?: SxProps<Theme>;
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ sx, variant = 'default', size = 'default', ...props }, ref) => (
  <StyledToggle
    ref={ref}
    toggleVariant={variant}
    toggleSize={size}
    sx={sx}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle }
