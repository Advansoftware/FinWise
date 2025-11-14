"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const StyledSwitchRoot = styled(SwitchPrimitives.Root)(({ theme }) => ({
  display: 'inline-flex',
  height: '1.5rem',
  width: '2.75rem',
  flexShrink: 0,
  cursor: 'pointer',
  alignItems: 'center',
  borderRadius: '9999px',
  border: '2px solid transparent',
  transition: theme.transitions.create(['background-color', 'box-shadow']),
  
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.ring + '33' : (theme.palette as any).custom?.ring + '33'}`,
  },
  
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  
  '&[data-state=checked]': {
    backgroundColor: theme.palette.primary.main,
  },
  
  '&[data-state=unchecked]': {
    backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.input : (theme.palette as any).custom?.input,
  },
}))

const StyledSwitchThumb = styled(SwitchPrimitives.Thumb)(({ theme }) => ({
  pointerEvents: 'none',
  display: 'block',
  height: '1.25rem',
  width: '1.25rem',
  borderRadius: '9999px',
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.background : (theme.palette as any).custom?.background,
  boxShadow: theme.shadows[2],
  transition: theme.transitions.create(['transform']),
  
  '&[data-state=checked]': {
    transform: 'translateX(1.25rem)',
  },
  
  '&[data-state=unchecked]': {
    transform: 'translateX(0)',
  },
}))

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  sx?: SxProps<Theme>;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ sx, ...props }, ref) => (
  <StyledSwitchRoot
    sx={sx}
    {...props}
    ref={ref}
  >
    <StyledSwitchThumb />
  </StyledSwitchRoot>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
