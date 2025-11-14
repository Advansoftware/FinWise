"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { styled, type Theme, type SxProps } from '@mui/material/styles'
import { Box } from '@mui/material'
import { Dialog, DialogContent } from "@/components/ui/dialog"

const StyledCommand = styled(CommandPrimitive)(({ theme }) => ({
  display: 'flex',
  height: '100%',
  width: '100%',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
  backgroundColor: (theme.palette as any).custom?.popover,
  color: (theme.palette as any).custom?.popoverForeground,
}))

interface CommandProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  sx?: SxProps<Theme>;
}

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  CommandProps
>(({ sx, ...props }, ref) => (
  <StyledCommand
    ref={ref}
    sx={sx}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent sx={{ overflow: 'hidden', p: 0, boxShadow: 3 }}>
        <StyledCommand
          sx={{
            '& [cmdk-group-heading]': {
              px: 2,
              fontWeight: theme => theme.typography.fontWeightMedium,
              color: theme => (theme.palette as any).custom?.mutedForeground,
            },
            '& [cmdk-group]:not([hidden]) ~ [cmdk-group]': {
              pt: 0,
            },
            '& [cmdk-group]': {
              px: 2,
            },
            '& [cmdk-input-wrapper] svg': {
              height: '1.25rem',
              width: '1.25rem',
            },
            '& [cmdk-input]': {
              height: '3rem',
            },
            '& [cmdk-item]': {
              px: 2,
              py: 3,
            },
            '& [cmdk-item] svg': {
              height: '1.25rem',
              width: '1.25rem',
            },
          }}
        >
          {children}
        </StyledCommand>
      </DialogContent>
    </Dialog>
  )
}

const StyledCommandInputWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
}))

const StyledCommandInputElement = styled(CommandPrimitive.Input)(({ theme }) => ({
  display: 'flex',
  height: '2.75rem',
  width: '100%',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
  backgroundColor: 'transparent',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  fontSize: theme.typography.pxToRem(14),
  outline: 'none',
  '&::placeholder': {
    color: (theme.palette as any).custom?.mutedForeground,
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
}))

interface CommandInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  sx?: SxProps<Theme>;
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>(({ sx, ...props }, ref) => (
  <StyledCommandInputWrapper sx={sx} cmdk-input-wrapper="">
    <Search style={{ marginRight: '0.5rem', height: '1rem', width: '1rem', flexShrink: 0, opacity: 0.5 }} />
    <StyledCommandInputElement
      ref={ref}
      {...props}
    />
  </StyledCommandInputWrapper>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const StyledCommandList = styled(CommandPrimitive.List)(({ theme }) => ({
  maxHeight: '300px',
  overflowY: 'auto',
  overflowX: 'hidden',
}))

interface CommandListProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> {
  sx?: SxProps<Theme>;
}

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  CommandListProps
>(({ sx, ...props }, ref) => (
  <StyledCommandList
    ref={ref}
    sx={sx}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const StyledCommandEmpty = styled(CommandPrimitive.Empty)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(6),
  textAlign: 'center',
  fontSize: theme.typography.pxToRem(14),
}))

interface CommandEmptyProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> {
  sx?: SxProps<Theme>;
}

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  CommandEmptyProps
>(({ sx, ...props }, ref) => (
  <StyledCommandEmpty
    ref={ref}
    sx={sx}
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const StyledCommandGroup = styled(CommandPrimitive.Group)(({ theme }) => ({
  overflow: 'hidden',
  padding: theme.spacing(1),
  color: theme.palette.text.primary,
  '& [cmdk-group-heading]': {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: theme.typography.pxToRem(12),
    fontWeight: theme.typography.fontWeightMedium,
    color: (theme.palette as any).custom?.mutedForeground,
  },
}))

interface CommandGroupProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> {
  sx?: SxProps<Theme>;
}

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>(({ sx, ...props }, ref) => (
  <StyledCommandGroup
    ref={ref}
    sx={sx}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const StyledCommandSeparator = styled(CommandPrimitive.Separator)(({ theme }) => ({
  marginLeft: theme.spacing(-1),
  marginRight: theme.spacing(-1),
  height: '1px',
  backgroundColor: theme.palette.divider,
}))

interface CommandSeparatorProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> {
  sx?: SxProps<Theme>;
}

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  CommandSeparatorProps
>(({ sx, ...props }, ref) => (
  <StyledCommandSeparator
    ref={ref}
    sx={sx}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const StyledCommandItem = styled(CommandPrimitive.Item)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  cursor: 'default',
  userSelect: 'none',
  alignItems: 'center',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  fontSize: theme.typography.pxToRem(14),
  outline: 'none',
  '&[aria-selected="true"]': {
    backgroundColor: (theme.palette as any).custom?.accent,
    color: (theme.palette as any).custom?.accentForeground,
  },
  '&[data-disabled="true"]': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
}))

interface CommandItemProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  sx?: SxProps<Theme>;
}

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>(({ sx, ...props }, ref) => (
  <StyledCommandItem
    ref={ref}
    sx={sx}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

interface CommandShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  sx?: SxProps<Theme>;
}

const CommandShortcut = ({
  sx,
  ...props
}: CommandShortcutProps) => {
  return (
    <Box
      component="span"
      sx={{
        marginLeft: 'auto',
        fontSize: theme => theme.typography.pxToRem(12),
        letterSpacing: '0.1em',
        color: theme => (theme.palette as any).custom?.mutedForeground,
        ...sx,
      }}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
}
