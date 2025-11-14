"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const StyledProgressRoot = styled(ProgressPrimitive.Root)(({ theme }) => ({
  position: 'relative',
  height: '1rem',
  width: '100%',
  overflow: 'hidden',
  borderRadius: '9999px',
  backgroundColor: theme.palette.secondary.main,
}))

const StyledProgressIndicator = styled(ProgressPrimitive.Indicator)(({ theme }) => ({
  height: '100%',
  width: '100%',
  flex: 1,
  backgroundColor: theme.palette.primary.main,
  transition: theme.transitions.create(['transform'], {
    duration: 500,
    easing: theme.transitions.easing.easeInOut,
  }),
}))

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  sx?: SxProps<Theme>;
  indicatorSx?: SxProps<Theme>;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ sx, value, indicatorSx, ...props }, ref) => (
  <StyledProgressRoot
    ref={ref}
    sx={sx}
    {...props}
  >
    <StyledProgressIndicator
      sx={indicatorSx}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </StyledProgressRoot>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
