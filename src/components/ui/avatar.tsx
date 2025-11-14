"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { styled, type Theme, type SxProps } from '@mui/material/styles'

const StyledAvatarRoot = styled(AvatarPrimitive.Root)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  height: '2.5rem',
  width: '2.5rem',
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: '9999px',
}))

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  sx?: SxProps<Theme>;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ sx, ...props }, ref) => (
  <StyledAvatarRoot
    ref={ref}
    sx={sx}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const StyledAvatarImage = styled(AvatarPrimitive.Image)({
  aspectRatio: '1 / 1',
  height: '100%',
  width: '100%',
})

interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  sx?: SxProps<Theme>;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ sx, ...props }, ref) => (
  <StyledAvatarImage
    ref={ref}
    sx={sx}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const StyledAvatarFallback = styled(AvatarPrimitive.Fallback)(({ theme }) => ({
  display: 'flex',
  height: '100%',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '9999px',
  backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.muted : (theme.palette as any).custom?.muted,
  fontWeight: theme.typography.fontWeightMedium,
}))

interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  sx?: SxProps<Theme>;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ sx, ...props }, ref) => (
  <StyledAvatarFallback
    ref={ref}
    sx={sx}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
