"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const StyledTooltipContent = styled(TooltipPrimitive.Content)(({ theme }) => ({
  zIndex: theme.zIndex.tooltip,
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.border : (theme.palette as any).custom?.border}`,
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popover : (theme.palette as any).custom?.popover,
  padding: theme.spacing(1.5, 3),
  fontSize: theme.typography.pxToRem(14),
  color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popoverForeground : (theme.palette as any).custom?.popoverForeground,
  boxShadow: theme.shadows[4],
  
  '&[data-state=delayed-open]': {
    animation: 'fadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '&[data-state=closed]': {
    animation: 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
  
  '@keyframes fadeOut': {
    from: {
      opacity: 1,
      transform: 'scale(1)',
    },
    to: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
  },
}))

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  sx?: SxProps<Theme>;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ sx, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <StyledTooltipContent
      ref={ref}
      sideOffset={sideOffset}
      sx={sx}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
