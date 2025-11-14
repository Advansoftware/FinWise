'use client';

import * as React from "react"
import { Box, Typography, type SxProps, type Theme, useTheme } from '@mui/material'
import { deepmerge } from '@mui/utils'

type AlertVariant = 'default' | 'destructive'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  sx?: SxProps<Theme>;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'default', sx, children, ...props }, ref) => {
    const theme = useTheme()
    
    const getVariantStyles = (): SxProps<Theme> => {
      switch (variant) {
        case 'destructive':
          return {
            border: `1px solid ${theme.palette.error.main}33`,
            color: theme.palette.error.main,
            '& > svg': {
              color: theme.palette.error.main,
            },
          }
        default:
          return {
            backgroundColor: theme.palette.mode === 'dark' ? (theme.palette as any).custom?.background : (theme.palette as any).custom?.background,
            color: theme.palette.text.primary,
            '& > svg': {
              color: theme.palette.text.primary,
            },
          }
      }
    }
    
    const baseStyles: SxProps<Theme> = {
      position: 'relative',
      width: '100%',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(4),
      '& > svg': {
        position: 'absolute',
        left: theme.spacing(4),
        top: theme.spacing(4),
      },
      '& > svg ~ *': {
        paddingLeft: theme.spacing(7),
      },
      '& > svg + div': {
        transform: 'translateY(-3px)',
      },
    }
    
    const combinedSx = deepmerge(
      deepmerge(baseStyles, getVariantStyles()),
      sx || {}
    )
    
    return (
      <Box
        ref={ref}
        role="alert"
        sx={combinedSx}
        {...props}
      >
        {children}
      </Box>
    )
  }
)
Alert.displayName = "Alert"

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  sx?: SxProps<Theme>;
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ sx, ...props }, ref) => {
    const theme = useTheme()
    
    return (
      <Typography
        ref={ref}
        variant="h5"
        component="h5"
        sx={{
          marginBottom: theme.spacing(1),
          fontWeight: theme.typography.fontWeightMedium,
          lineHeight: 1,
          letterSpacing: '-0.025em',
          ...(typeof sx === 'function' ? sx(theme) : sx),
        }}
        {...props}
      />
    )
  }
)
AlertTitle.displayName = "AlertTitle"

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  sx?: SxProps<Theme>;
}

const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ sx, ...props }, ref) => {
    const theme = useTheme()
    
    return (
      <Box
        ref={ref}
        sx={{
          fontSize: theme.typography.pxToRem(14),
          '& p': {
            lineHeight: 1.625,
          },
          ...(typeof sx === 'function' ? sx(theme) : sx),
        }}
        {...props}
      />
    )
  }
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
