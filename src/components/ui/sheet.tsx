"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { styled, useTheme, type Theme, type SxProps } from '@mui/material/styles'
import { Box, Typography } from '@mui/material'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const StyledSheetOverlay = styled(SheetPrimitive.Overlay)(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: theme.zIndex.drawer,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  
  '&[data-state=open]': {
    animation: 'fadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '&[data-state=closed]': {
    animation: 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  
  '@keyframes fadeOut': {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
}))

interface SheetOverlayProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> {
  sx?: SxProps<Theme>;
}

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  SheetOverlayProps
>(({ sx, ...props }, ref) => (
  <StyledSheetOverlay
    sx={sx}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

type SheetSide = 'top' | 'bottom' | 'left' | 'right'

const StyledSheetContent = styled(SheetPrimitive.Content, {
  shouldForwardProp: (prop) => prop !== 'side',
})<{ side?: SheetSide }>(({ theme, side = 'right' }) => {
  const sideStyles = {
    top: {
      inset: '0 0 auto 0',
      borderBottom: `1px solid ${theme.palette.divider}`,
      '&[data-state=closed]': {
        animation: 'slideOutToTop 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '&[data-state=open]': {
        animation: 'slideInFromTop 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    bottom: {
      inset: 'auto 0 0 0',
      borderTop: `1px solid ${theme.palette.divider}`,
      '&[data-state=closed]': {
        animation: 'slideOutToBottom 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '&[data-state=open]': {
        animation: 'slideInFromBottom 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    left: {
      inset: '0 auto 0 0',
      height: '100%',
      width: '75%',
      maxWidth: '20rem',
      borderRight: `1px solid ${theme.palette.divider}`,
      [theme.breakpoints.up('sm')]: {
        maxWidth: '20rem',
      },
      '&[data-state=closed]': {
        animation: 'slideOutToLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '&[data-state=open]': {
        animation: 'slideInFromLeft 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    right: {
      inset: '0 0 0 auto',
      height: '100%',
      width: '100%',
      maxWidth: '20rem',
      borderLeft: `1px solid ${theme.palette.divider}`,
      [theme.breakpoints.up('md')]: {
        width: '75%',
        maxWidth: '20rem',
      },
      '&[data-state=closed]': {
        animation: 'slideOutToRight 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '&[data-state=open]': {
        animation: 'slideInFromRight 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  }
  
  return {
    position: 'fixed',
    zIndex: theme.zIndex.drawer,
    gap: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(6),
    boxShadow: theme.shadows[8],
    transition: theme.transitions.create(['transform'], {
      duration: 300,
      easing: theme.transitions.easing.easeInOut,
    }),
    
    ...sideStyles[side],
    
    '@keyframes slideOutToTop': {
      from: { transform: 'translateY(0)' },
      to: { transform: 'translateY(-100%)' },
    },
    '@keyframes slideInFromTop': {
      from: { transform: 'translateY(-100%)' },
      to: { transform: 'translateY(0)' },
    },
    '@keyframes slideOutToBottom': {
      from: { transform: 'translateY(0)' },
      to: { transform: 'translateY(100%)' },
    },
    '@keyframes slideInFromBottom': {
      from: { transform: 'translateY(100%)' },
      to: { transform: 'translateY(0)' },
    },
    '@keyframes slideOutToLeft': {
      from: { transform: 'translateX(0)' },
      to: { transform: 'translateX(-100%)' },
    },
    '@keyframes slideInFromLeft': {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0)' },
    },
    '@keyframes slideOutToRight': {
      from: { transform: 'translateX(0)' },
      to: { transform: 'translateX(100%)' },
    },
    '@keyframes slideInFromRight': {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
  }
})

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: SheetSide;
  sx?: SxProps<Theme>;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", sx, children, ...props }, ref) => {
  const theme = useTheme()
  
  return (
    <SheetPortal>
      <SheetOverlay />
      <StyledSheetContent
        ref={ref}
        side={side}
        sx={sx}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          style={{
            position: 'absolute',
            right: theme.spacing(4),
            top: theme.spacing(4),
            borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
            opacity: 0.7,
            transition: theme.transitions.create(['opacity', 'box-shadow']),
          }}
        >
          <X style={{ width: '1rem', height: '1rem' }} />
          <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Close</span>
        </SheetPrimitive.Close>
      </StyledSheetContent>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
}

const SheetHeader = ({ sx, ...props }: SheetHeaderProps) => {
  const theme = useTheme()
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        textAlign: 'center',
        [theme.breakpoints.up('sm')]: {
          textAlign: 'left',
        },
        ...sx,
      }}
      {...props}
    />
  )
}
SheetHeader.displayName = "SheetHeader"

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
}

const SheetFooter = ({ sx, ...props }: SheetFooterProps) => {
  const theme = useTheme()
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column-reverse',
        [theme.breakpoints.up('sm')]: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: theme.spacing(2),
        },
        ...sx,
      }}
      {...props}
    />
  )
}
SheetFooter.displayName = "SheetFooter"

interface SheetTitleProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> {
  sx?: SxProps<Theme>;
}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  SheetTitleProps
>(({ sx, ...props }, ref) => {
  const theme = useTheme()
  
  return (
    <SheetPrimitive.Title
      ref={ref}
      asChild
    >
      <Typography
        variant="h6"
        sx={{
          fontSize: theme.typography.pxToRem(18),
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.text.primary,
          ...sx,
        }}
        {...props}
      />
    </SheetPrimitive.Title>
  )
})
SheetTitle.displayName = SheetPrimitive.Title.displayName

interface SheetDescriptionProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> {
  sx?: SxProps<Theme>;
}

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  SheetDescriptionProps
>(({ sx, ...props }, ref) => {
  const theme = useTheme()
  
  return (
    <SheetPrimitive.Description
      ref={ref}
      asChild
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: theme.typography.pxToRem(14),
          color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.mutedForeground : (theme.palette as any).custom?.mutedForeground,
          ...sx,
        }}
        {...props}
      />
    </SheetPrimitive.Description>
  )
})
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
