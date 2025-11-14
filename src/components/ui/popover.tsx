"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const StyledPopoverContent = styled(PopoverPrimitive.Content)(({ theme }) => ({
  zIndex: theme.zIndex.modal,
  width: '18rem',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.border : (theme.palette as any).custom?.border}`,
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popover : (theme.palette as any).custom?.popover,
  padding: theme.spacing(4),
  color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popoverForeground : (theme.palette as any).custom?.popoverForeground,
  boxShadow: theme.shadows[4],
  outline: 'none',
  
  '&[data-state=open]': {
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

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  sx?: SxProps<Theme>;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ sx, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <StyledPopoverContent
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      sx={sx}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
