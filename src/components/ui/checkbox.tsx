"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const StyledCheckboxRoot = styled(CheckboxPrimitive.Root)(({ theme }) => ({
  height: '1rem',
  width: '1rem',
  flexShrink: 0,
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
  border: `1px solid ${theme.palette.primary.main}`,
  transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow']),
  
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
    color: theme.palette.primary.contrastText,
  },
}))

const StyledCheckboxIndicator = styled(CheckboxPrimitive.Indicator)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'currentColor',
})

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  sx?: SxProps<Theme>;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ sx, ...props }, ref) => (
  <StyledCheckboxRoot
    ref={ref}
    sx={sx}
    {...props}
  >
    <StyledCheckboxIndicator>
      <Check style={{ width: '1rem', height: '1rem' }} />
    </StyledCheckboxIndicator>
  </StyledCheckboxRoot>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
