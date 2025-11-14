"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { styled, useTheme, type Theme, type SxProps } from '@mui/material/styles'
import { Box } from '@mui/material'

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

// Styled SelectTrigger
const StyledSelectTrigger = styled(SelectPrimitive.Trigger)(({ theme }) => ({
  display: 'flex',
  height: '2.5rem', // 40px
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.input : (theme.palette as any).custom?.input}`,
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.background : (theme.palette as any).custom?.background,
  padding: '0.5rem 0.75rem',
  fontSize: theme.typography.pxToRem(14),
  color: theme.palette.text.primary,
  transition: theme.transitions.create(['border-color', 'box-shadow']),
  
  '&::placeholder': {
    color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.mutedForeground : (theme.palette as any).custom?.mutedForeground,
  },
  
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.ring : (theme.palette as any).custom?.ring,
    boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.ring + '33' : (theme.palette as any).custom?.ring + '33'}`,
  },
  
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  
  '& > span': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}))

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  sx?: SxProps<Theme>;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ sx, children, ...props }, ref) => {
  const theme = useTheme()
  
  return (
    <StyledSelectTrigger
      ref={ref}
      sx={sx}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown style={{ width: '1rem', height: '1rem', opacity: 0.5 }} />
      </SelectPrimitive.Icon>
    </StyledSelectTrigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    style={{
      display: 'flex',
      cursor: 'default',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.25rem 0',
    }}
    {...props}
  >
    <ChevronUp style={{ width: '1rem', height: '1rem' }} />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    style={{
      display: 'flex',
      cursor: 'default',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.25rem 0',
    }}
    {...props}
  >
    <ChevronDown style={{ width: '1rem', height: '1rem' }} />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

// Styled SelectContent
const StyledSelectContent = styled(SelectPrimitive.Content)(({ theme }) => ({
  position: 'relative',
  zIndex: theme.zIndex.modal,
  maxHeight: '24rem',
  minWidth: '8rem',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.border : (theme.palette as any).custom?.border}`,
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popover : (theme.palette as any).custom?.popover,
  color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.popoverForeground : (theme.palette as any).custom?.popoverForeground,
  boxShadow: theme.shadows[4],
  
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

const StyledSelectViewport = styled(SelectPrimitive.Viewport)<{ position?: 'item-aligned' | 'popper' }>(({ theme, position }) => ({
  padding: '0.25rem',
  ...(position === 'popper' && {
    height: 'var(--radix-select-trigger-height)',
    width: '100%',
    minWidth: 'var(--radix-select-trigger-width)',
  }),
}))

interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  sx?: SxProps<Theme>;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ sx, children, position = "popper", ...props }, ref) => {
  const theme = useTheme()
  
  return (
    <SelectPrimitive.Portal>
      <StyledSelectContent
        ref={ref}
        sx={sx}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <StyledSelectViewport position={position}>
          {children}
        </StyledSelectViewport>
        <SelectScrollDownButton />
      </StyledSelectContent>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

// Styled SelectLabel
const StyledSelectLabel = styled(SelectPrimitive.Label)(({ theme }) => ({
  padding: '0.375rem 2rem 0.375rem 0.5rem',
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightMedium,
  color: theme.palette.text.primary,
}))

interface SelectLabelProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {
  sx?: SxProps<Theme>;
}

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>(({ sx, ...props }, ref) => (
  <StyledSelectLabel
    ref={ref}
    sx={sx}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

// Styled SelectItem
const StyledSelectItem = styled(SelectPrimitive.Item)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  width: '100%',
  cursor: 'default',
  userSelect: 'none',
  alignItems: 'center',
  borderRadius: theme.shape.borderRadius,
  padding: '0.375rem 2rem 0.375rem 0.5rem',
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

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  sx?: SxProps<Theme>;
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ sx, children, ...props }, ref) => (
  <StyledSelectItem
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
      <SelectPrimitive.ItemIndicator>
        <Check style={{ width: '1rem', height: '1rem' }} />
      </SelectPrimitive.ItemIndicator>
    </Box>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </StyledSelectItem>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

// Styled SelectSeparator
const StyledSelectSeparator = styled(SelectPrimitive.Separator)(({ theme }) => ({
  margin: '0.25rem -0.25rem',
  height: '1px',
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.muted : (theme.palette as any).custom?.muted,
}))

interface SelectSeparatorProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {
  sx?: SxProps<Theme>;
}

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(({ sx, ...props }, ref) => (
  <StyledSelectSeparator
    ref={ref}
    sx={sx}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
