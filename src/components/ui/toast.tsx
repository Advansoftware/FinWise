"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const ToastProvider = ToastPrimitives.Provider

const StyledToastViewport = styled(ToastPrimitives.Viewport)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  zIndex: 100,
  display: 'flex',
  maxHeight: '100vh',
  width: '100%',
  flexDirection: 'column-reverse',
  padding: theme.spacing(4),
  [theme.breakpoints.up('sm')]: {
    bottom: 0,
    right: 0,
    top: 'auto',
    flexDirection: 'column',
  },
  [theme.breakpoints.up('md')]: {
    maxWidth: '420px',
  },
}))

interface ToastViewportProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> {
  sx?: SxProps<Theme>;
}

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  ToastViewportProps
>(({ sx, ...props }, ref) => (
  <StyledToastViewport
    ref={ref}
    sx={sx}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const StyledToastRoot = styled(ToastPrimitives.Root, {
  shouldForwardProp: (prop) => prop !== 'variant',
})<{ variant?: 'default' | 'destructive' }>(({ theme, variant = 'default' }) => ({
  pointerEvents: 'auto',
  position: 'relative',
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
  overflow: 'hidden',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(6),
  paddingRight: theme.spacing(8),
  boxShadow: theme.shadows[3],
  transition: theme.transitions.create(['transform', 'opacity']),
  
  '&[data-swipe="cancel"]': {
    transform: 'translateX(0)',
  },
  '&[data-swipe="end"]': {
    transform: 'var(--radix-toast-swipe-end-x)',
  },
  '&[data-swipe="move"]': {
    transform: 'var(--radix-toast-swipe-move-x)',
    transition: 'none',
  },
  '&[data-state="open"]': {
    animation: 'slideInFromTop 150ms cubic-bezier(0.16, 1, 0.3, 1)',
    [theme.breakpoints.up('sm')]: {
      animation: 'slideInFromBottom 150ms cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
  '&[data-state="closed"]': {
    animation: 'slideOutToRight 100ms ease-in, fadeOut 100ms ease-in',
    opacity: 0,
  },
  
  ...(variant === 'default' && {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  }),
  
  ...(variant === 'destructive' && {
    border: `1px solid ${theme.palette.error.main}`,
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  }),
  
  '@keyframes slideInFromTop': {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
  '@keyframes slideInFromBottom': {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  '@keyframes slideOutToRight': {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(100%)' },
  },
  '@keyframes fadeOut': {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
}))

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: 'default' | 'destructive';
  sx?: SxProps<Theme>;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ variant = 'default', sx, ...props }, ref) => {
  return (
    <StyledToastRoot
      ref={ref}
      variant={variant}
      sx={sx}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const StyledToastAction = styled(ToastPrimitives.Action)(({ theme }) => ({
  display: 'inline-flex',
  height: '2rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: 'transparent',
  padding: theme.spacing(0, 3),
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightMedium,
  transition: theme.transitions.create(['background-color', 'color', 'border-color', 'box-shadow']),
  '&:hover': {
    backgroundColor: (theme.palette as any).custom?.secondary,
  },
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${(theme.palette as any).custom?.ring}`,
  },
  '&:disabled': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
  '.destructive &': {
    borderColor: `${(theme.palette as any).custom?.muted}40`,
    '&:hover': {
      borderColor: `${theme.palette.error.main}30`,
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${theme.palette.error.main}`,
    },
  },
}))

interface ToastActionProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> {
  sx?: SxProps<Theme>;
}

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  ToastActionProps
>(({ sx, ...props }, ref) => (
  <StyledToastAction
    ref={ref}
    sx={sx}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const StyledToastClose = styled(ToastPrimitives.Close)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(2),
  top: theme.spacing(2),
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
  padding: theme.spacing(1),
  color: `${theme.palette.text.primary}80`,
  opacity: 0,
  transition: theme.transitions.create(['opacity', 'color', 'box-shadow']),
  '&:hover': {
    color: theme.palette.text.primary,
  },
  '&:focus': {
    opacity: 1,
    outline: 'none',
    boxShadow: `0 0 0 2px ${(theme.palette as any).custom?.ring}`,
  },
  '.group:hover &': {
    opacity: 1,
  },
  '.destructive &': {
    color: theme.palette.error.light,
    '&:hover': {
      color: '#fff',
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${theme.palette.error.dark}`,
    },
  },
}))

interface ToastCloseProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> {
  sx?: SxProps<Theme>;
}

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  ToastCloseProps
>(({ sx, ...props }, ref) => (
  <StyledToastClose
    ref={ref}
    sx={sx}
    toast-close=""
    {...props}
  >
    <X style={{ width: '1rem', height: '1rem' }} />
  </StyledToastClose>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const StyledToastTitle = styled(ToastPrimitives.Title)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightBold,
}))

interface ToastTitleProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> {
  sx?: SxProps<Theme>;
}

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  ToastTitleProps
>(({ sx, ...props }, ref) => (
  <StyledToastTitle
    ref={ref}
    sx={sx}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const StyledToastDescription = styled(ToastPrimitives.Description)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(14),
  opacity: 0.9,
}))

interface ToastDescriptionProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> {
  sx?: SxProps<Theme>;
}

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  ToastDescriptionProps
>(({ sx, ...props }, ref) => (
  <StyledToastDescription
    ref={ref}
    sx={sx}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
