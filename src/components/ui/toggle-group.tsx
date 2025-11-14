"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

type ToggleVariant = 'default' | 'outline'
type ToggleSize = 'default' | 'sm' | 'lg'

const ToggleGroupContext = React.createContext<{
  size?: ToggleSize;
  variant?: ToggleVariant;
}>({
  size: "default",
  variant: "default",
})

const StyledToggleGroupRoot = styled(ToggleGroupPrimitive.Root)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
}))

type ToggleGroupSingleProps = {
  type: 'single';
  value?: string;
  onValueChange?: (value: string) => void;
}

type ToggleGroupMultipleProps = {
  type: 'multiple';
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

interface ToggleGroupBaseProps {
  variant?: ToggleVariant;
  size?: ToggleSize;
  sx?: SxProps<Theme>;
}

type ToggleGroupProps = ToggleGroupBaseProps & (ToggleGroupSingleProps | ToggleGroupMultipleProps) & Omit<React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>, 'asChild' | 'type' | 'value' | 'onValueChange'>

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ sx, variant, size, children, ...props }, ref) => (
  <StyledToggleGroupRoot
    ref={ref}
    sx={sx}
    {...props as any}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </StyledToggleGroupRoot>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const StyledToggleGroupItem = styled(ToggleGroupPrimitive.Item, {
  shouldForwardProp: (prop) => prop !== 'toggleVariant' && prop !== 'toggleSize',
})<{ toggleVariant?: ToggleVariant; toggleSize?: ToggleSize }>(({ theme, toggleVariant = 'default', toggleSize = 'default' }) => {
  const sizeStyles = {
    default: { height: '2.5rem', padding: theme.spacing(0, 3) },
    sm: { height: '2.25rem', padding: theme.spacing(0, 2.5) },
    lg: { height: '2.75rem', padding: theme.spacing(0, 5) },
  }
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.borderRadius,
    fontSize: theme.typography.pxToRem(14),
    fontWeight: theme.typography.fontWeightMedium,
    transition: theme.transitions.create(['background-color', 'color']),
    
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.muted : (theme.palette as any).custom?.muted,
    },
    
    '&[data-state=on]': {
      backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accent : (theme.palette as any).custom?.accent,
      color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accentForeground : (theme.palette as any).custom?.accentForeground,
    },
    
    ...sizeStyles[toggleSize],
  }
})

interface ToggleGroupItemProps extends Omit<React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>, 'asChild'> {
  variant?: ToggleVariant;
  size?: ToggleSize;
  sx?: SxProps<Theme>;
}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ sx, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <StyledToggleGroupItem
      ref={ref}
      toggleVariant={context.variant || variant}
      toggleSize={context.size || size}
      sx={sx}
      {...props}
    >
      {children}
    </StyledToggleGroupItem>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
