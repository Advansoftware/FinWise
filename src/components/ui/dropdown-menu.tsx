"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { styled, type Theme, type SxProps, useTheme } from '@mui/material/styles'
import { Box } from '@mui/material'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const StyledDropdownMenuSubTrigger = styled(DropdownMenuPrimitive.SubTrigger, {
  shouldForwardProp: (prop) => prop !== 'inset',
})<{ inset?: boolean }>(({ theme, inset }) => ({
  display: 'flex',
  cursor: 'default',
  gap: theme.spacing(2),
  userSelect: 'none',
  alignItems: 'center',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
  padding: theme.spacing(1.5, 2),
  paddingLeft: inset ? theme.spacing(8) : theme.spacing(2),
  fontSize: theme.typography.pxToRem(14),
  outline: 'none',
  transition: theme.transitions.create(['background-color', 'color']),
  
  '&:focus, &[data-state=open]': {
    backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accent : (theme.palette as any).custom?.accent,
  },
  
  '& svg': {
    pointerEvents: 'none',
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
}))

interface DropdownMenuSubTriggerProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
  sx?: SxProps<Theme>;
}

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>(({ sx, inset, children, ...props }, ref) => (
  <StyledDropdownMenuSubTrigger
    ref={ref}
    inset={inset}
    sx={sx}
    {...props}
  >
    {children}
    <ChevronRight style={{ marginLeft: 'auto', width: '1rem', height: '1rem' }} />
  </StyledDropdownMenuSubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const StyledDropdownMenuSubContent = styled(DropdownMenuPrimitive.SubContent)(({ theme }) => ({
  zIndex: theme.zIndex.modal,
  minWidth: '8rem',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.border : (theme.palette as any).custom?.border}`,
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popover : (theme.palette as any).custom?.popover,
  padding: theme.spacing(1),
  color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popoverForeground : (theme.palette as any).custom?.popoverForeground,
  boxShadow: theme.shadows[6],
  
  '&[data-state=open]': {
    animation: 'fadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '&[data-state=closed]': {
    animation: 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  
  '@keyframes fadeOut': {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.95)' },
  },
}))

interface DropdownMenuSubContentProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> {
  sx?: SxProps<Theme>;
}

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuSubContentProps
>(({ sx, ...props }, ref) => (
  <StyledDropdownMenuSubContent
    ref={ref}
    sx={sx}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const StyledDropdownMenuContent = styled(DropdownMenuPrimitive.Content)(({ theme }) => ({
  zIndex: theme.zIndex.modal,
  minWidth: '8rem',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.border : (theme.palette as any).custom?.border}`,
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popover : (theme.palette as any).custom?.popover,
  padding: theme.spacing(1),
  color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popoverForeground : (theme.palette as any).custom?.popoverForeground,
  boxShadow: theme.shadows[4],
  
  '&[data-state=open]': {
    animation: 'fadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '&[data-state=closed]': {
    animation: 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  
  '@keyframes fadeOut': {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.95)' },
  },
}))

interface DropdownMenuContentProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  sx?: SxProps<Theme>;
}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ sx, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <StyledDropdownMenuContent
      ref={ref}
      sideOffset={sideOffset}
      sx={sx}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const StyledDropdownMenuItem = styled(DropdownMenuPrimitive.Item, {
  shouldForwardProp: (prop) => prop !== 'inset',
})<{ inset?: boolean }>(({ theme, inset }) => ({
  position: 'relative',
  display: 'flex',
  cursor: 'default',
  userSelect: 'none',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
  padding: theme.spacing(1.5, 2),
  paddingLeft: inset ? theme.spacing(8) : theme.spacing(2),
  fontSize: theme.typography.pxToRem(14),
  outline: 'none',
  transition: theme.transitions.create(['background-color', 'color']),
  
  '&:focus': {
    backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accent : (theme.palette as any).custom?.accent,
    color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accentForeground : (theme.palette as any).custom?.accentForeground,
  },
  
  '&[data-disabled]': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
  
  '& svg': {
    pointerEvents: 'none',
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
}))

interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
  sx?: SxProps<Theme>;
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ sx, inset, ...props }, ref) => (
  <StyledDropdownMenuItem
    ref={ref}
    inset={inset}
    sx={sx}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const StyledDropdownMenuCheckboxItem = styled(DropdownMenuPrimitive.CheckboxItem)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  cursor: 'default',
  userSelect: 'none',
  alignItems: 'center',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
  padding: theme.spacing(1.5, 2, 1.5, 8),
  fontSize: theme.typography.pxToRem(14),
  outline: 'none',
  transition: theme.transitions.create(['background-color', 'color']),
  
  '&:focus': {
    backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accent : (theme.palette as any).custom?.accent,
    color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accentForeground : (theme.palette as any).custom?.accentForeground,
  },
  
  '&[data-disabled]': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
}))

interface DropdownMenuCheckboxItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> {
  sx?: SxProps<Theme>;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(({ sx, children, checked, ...props }, ref) => (
  <StyledDropdownMenuCheckboxItem
    ref={ref}
    sx={sx}
    checked={checked}
    {...props}
  >
    <Box
      component="span"
      sx={{
        position: 'absolute',
        left: '0.5rem',
        display: 'flex',
        height: '0.875rem',
        width: '0.875rem',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Check style={{ width: '1rem', height: '1rem' }} />
      </DropdownMenuPrimitive.ItemIndicator>
    </Box>
    {children}
  </StyledDropdownMenuCheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const StyledDropdownMenuRadioItem = styled(DropdownMenuPrimitive.RadioItem)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  cursor: 'default',
  userSelect: 'none',
  alignItems: 'center',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
  padding: theme.spacing(1.5, 2, 1.5, 8),
  fontSize: theme.typography.pxToRem(14),
  outline: 'none',
  transition: theme.transitions.create(['background-color', 'color']),
  
  '&:focus': {
    backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accent : (theme.palette as any).custom?.accent,
    color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.accentForeground : (theme.palette as any).custom?.accentForeground,
  },
  
  '&[data-disabled]': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
}))

interface DropdownMenuRadioItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> {
  sx?: SxProps<Theme>;
}

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(({ sx, children, ...props }, ref) => (
  <StyledDropdownMenuRadioItem
    ref={ref}
    sx={sx}
    {...props}
  >
    <Box
      component="span"
      sx={{
        position: 'absolute',
        left: '0.5rem',
        display: 'flex',
        height: '0.875rem',
        width: '0.875rem',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle style={{ width: '0.5rem', height: '0.5rem', fill: 'currentColor' }} />
      </DropdownMenuPrimitive.ItemIndicator>
    </Box>
    {children}
  </StyledDropdownMenuRadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const StyledDropdownMenuLabel = styled(DropdownMenuPrimitive.Label, {
  shouldForwardProp: (prop) => prop !== 'inset',
})<{ inset?: boolean }>(({ theme, inset }) => ({
  padding: theme.spacing(1.5, 2),
  paddingLeft: inset ? theme.spacing(8) : theme.spacing(2),
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightMedium,
}))

interface DropdownMenuLabelProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
  sx?: SxProps<Theme>;
}

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ sx, inset, ...props }, ref) => (
  <StyledDropdownMenuLabel
    ref={ref}
    inset={inset}
    sx={sx}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const StyledDropdownMenuSeparator = styled(DropdownMenuPrimitive.Separator)(({ theme }) => ({
  margin: theme.spacing(1, -1),
  height: '1px',
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.muted : (theme.palette as any).custom?.muted,
}))

interface DropdownMenuSeparatorProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> {
  sx?: SxProps<Theme>;
}

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>(({ sx, ...props }, ref) => (
  <StyledDropdownMenuSeparator
    ref={ref}
    sx={sx}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  sx?: SxProps<Theme>;
}

const DropdownMenuShortcut = ({ sx, ...props }: DropdownMenuShortcutProps) => {
  const theme = useTheme()
  
  return (
    <Box
      component="span"
      sx={{
        marginLeft: 'auto',
        fontSize: theme.typography.pxToRem(12),
        letterSpacing: '0.1em',
        opacity: 0.6,
        ...(typeof sx === 'function' ? sx(theme) : sx),
      }}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
