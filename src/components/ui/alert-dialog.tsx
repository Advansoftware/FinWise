"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { styled, type Theme, type SxProps, useTheme } from '@mui/material/styles'
import { Box, Typography } from '@mui/material'
import { Button } from '@/components/ui/button'

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const StyledAlertDialogOverlay = styled(AlertDialogPrimitive.Overlay)(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: theme.zIndex.modal,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  '&[data-state=open]': { animation: 'fadeIn 150ms' },
  '&[data-state=closed]': { animation: 'fadeOut 150ms' },
  '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
  '@keyframes fadeOut': { from: { opacity: 1 }, to: { opacity: 0 } },
}))

const AlertDialogOverlay = React.forwardRef<React.ElementRef<typeof AlertDialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => <StyledAlertDialogOverlay sx={sx} {...props} ref={ref} />
)
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const StyledAlertDialogContent = styled(AlertDialogPrimitive.Content)(({ theme }) => ({
  position: 'fixed',
  left: '50%',
  top: '50%',
  zIndex: theme.zIndex.modal,
  display: 'grid',
  width: '100%',
  maxWidth: '32rem',
  transform: 'translate(-50%, -50%)',
  gap: theme.spacing(4),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(6),
  boxShadow: theme.shadows[8],
  borderRadius: theme.shape.borderRadius,
  '&[data-state=open]': { animation: 'contentShow 200ms' },
  '&[data-state=closed]': { animation: 'contentHide 200ms' },
  '@keyframes contentShow': { from: { opacity: 0, transform: 'translate(-50%, -48%) scale(0.95)' }, to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' } },
  '@keyframes contentHide': { from: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }, to: { opacity: 0, transform: 'translate(-50%, -48%) scale(0.95)' } },
}))

const AlertDialogContent = React.forwardRef<React.ElementRef<typeof AlertDialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <StyledAlertDialogContent ref={ref} sx={sx} {...props} />
    </AlertDialogPortal>
  )
)
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({ sx, ...props }: React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }) => {
  const theme = useTheme()
  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(2), textAlign: 'center', [theme.breakpoints.up('sm')]: { textAlign: 'left' }, ...sx }} {...props} />
}
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({ sx, ...props }: React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }) => {
  const theme = useTheme()
  return <Box sx={{ display: 'flex', flexDirection: 'column-reverse', [theme.breakpoints.up('sm')]: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing(2) }, ...sx }} {...props} />
}
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<React.ElementRef<typeof AlertDialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => {
    const theme = useTheme()
    return <AlertDialogPrimitive.Title ref={ref} asChild><Typography variant="h6" sx={{ fontSize: theme.typography.pxToRem(18), fontWeight: theme.typography.fontWeightMedium, ...sx }} {...props} /></AlertDialogPrimitive.Title>
  }
)
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<React.ElementRef<typeof AlertDialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => {
    const theme = useTheme()
    return <AlertDialogPrimitive.Description ref={ref} asChild><Typography variant="body2" sx={{ fontSize: theme.typography.pxToRem(14), color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.mutedForeground : (theme.palette as any).custom?.mutedForeground, ...sx }} {...props} /></AlertDialogPrimitive.Description>
  }
)
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<React.ElementRef<typeof AlertDialogPrimitive.Action>, React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => <AlertDialogPrimitive.Action ref={ref} asChild><Button sx={sx} {...props} /></AlertDialogPrimitive.Action>
)
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<React.ElementRef<typeof AlertDialogPrimitive.Cancel>, React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => <AlertDialogPrimitive.Cancel ref={ref} asChild><Button variant="outline" sx={sx} {...props} /></AlertDialogPrimitive.Cancel>
)
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
