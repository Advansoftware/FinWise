"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const Tabs = TabsPrimitive.Root

const StyledTabsList = styled(TabsPrimitive.List)(({ theme }) => ({
  display: 'inline-flex',
  height: '2.5rem',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.muted : (theme.palette as any).custom?.muted,
  padding: theme.spacing(1),
  color: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.mutedForeground : (theme.palette as any).custom?.mutedForeground,
}))

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  sx?: SxProps<Theme>;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ sx, ...props }, ref) => (
  <StyledTabsList
    ref={ref}
    sx={sx}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const StyledTabsTrigger = styled(TabsPrimitive.Trigger)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius / 2 : 4,
  padding: theme.spacing(1.5, 3),
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightMedium,
  transition: theme.transitions.create(['background-color', 'color', 'box-shadow']),
  
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.ring + '33' : (theme.palette as any).custom?.ring + '33'}`,
  },
  
  '&:disabled': {
    pointerEvents: 'none',
    opacity: 0.5,
  },
  
  '&[data-state=active]': {
    backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.background : (theme.palette as any).custom?.background,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
  },
}))

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  sx?: SxProps<Theme>;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ sx, ...props }, ref) => (
  <StyledTabsTrigger
    ref={ref}
    sx={sx}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const StyledTabsContent = styled(TabsPrimitive.Content)(({ theme }) => ({
  marginTop: theme.spacing(2),
  
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? (theme.palette as any).custom?.ring + '33' : (theme.palette as any).custom?.ring + '33'}`,
  },
}))

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  sx?: SxProps<Theme>;
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ sx, ...props }, ref) => (
  <StyledTabsContent
    ref={ref}
    sx={sx}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
