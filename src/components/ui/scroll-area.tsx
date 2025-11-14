"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const StyledScrollAreaRoot = styled(ScrollAreaPrimitive.Root)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
}))

const StyledScrollAreaViewport = styled(ScrollAreaPrimitive.Viewport)({
  height: '100%',
  width: '100%',
  borderRadius: 'inherit',
})

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  sx?: SxProps<Theme>;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ sx, children, ...props }, ref) => (
  <StyledScrollAreaRoot
    ref={ref}
    sx={sx}
    {...props}
  >
    <StyledScrollAreaViewport>
      {children}
    </StyledScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </StyledScrollAreaRoot>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const StyledScrollBar = styled(ScrollAreaPrimitive.ScrollAreaScrollbar, {
  shouldForwardProp: (prop) => prop !== 'orientation',
})<{ orientation?: 'vertical' | 'horizontal' }>(({ theme, orientation = 'vertical' }) => ({
  display: 'flex',
  touchAction: 'none',
  userSelect: 'none',
  transition: theme.transitions.create('background-color'),
  
  ...(orientation === 'vertical' && {
    height: '100%',
    width: '0.625rem',
    borderLeft: `1px solid transparent`,
    padding: '1px',
  }),
  
  ...(orientation === 'horizontal' && {
    height: '0.625rem',
    flexDirection: 'column',
    borderTop: `1px solid transparent`,
    padding: '1px',
  }),
}))

const StyledScrollBarThumb = styled(ScrollAreaPrimitive.ScrollAreaThumb)(({ theme }) => ({
  position: 'relative',
  flex: 1,
  borderRadius: '9999px',
  backgroundColor: theme.palette.divider,
}))

interface ScrollBarProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  sx?: SxProps<Theme>;
}

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ sx, orientation = "vertical", ...props }, ref) => (
  <StyledScrollBar
    ref={ref}
    orientation={orientation}
    sx={sx}
    {...props}
  >
    <StyledScrollBarThumb />
  </StyledScrollBar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
