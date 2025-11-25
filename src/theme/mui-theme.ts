// src/theme/mui-theme.ts
'use client';

import { createTheme, ThemeOptions, alpha, Components, Theme } from '@mui/material/styles';
import { colorsDark, typography as typographyTokens, radius, shadows as shadowTokens, breakpoints as breakpointsTokens, zIndex as zIndexTokens } from './tokens';

// Cores do tema dark - única fonte de verdade
const colors = colorsDark;

// Paleta de cores para dark mode
const createPalette = () => {
  return {
    mode: 'dark' as const,
    primary: {
      main: colors.primary,
      light: alpha(colors.primary, 0.7),
      dark: colors.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary,
      light: alpha(colors.secondary, 0.7),
      dark: colors.secondary,
      contrastText: colors.foreground,
    },
    error: {
      main: '#ef4444', // Vermelho vibrante para dark mode
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // Âmbar/Laranja vibrante
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#000000',
    },
    info: {
      main: '#3b82f6', // Azul vibrante
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Verde esmeralda vibrante
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: colors.background,
      paper: colors.card,
    },
    text: {
      primary: colors.foreground,
      secondary: colors.mutedForeground,
      disabled: alpha(colors.mutedForeground, 0.5),
    },
    divider: colors.border,
    action: {
      active: colors.foreground,
      hover: alpha(colors.foreground, 0.08),
      selected: alpha(colors.foreground, 0.12),
      disabled: alpha(colors.mutedForeground, 0.3),
      disabledBackground: alpha(colors.muted, 0.12),
      focus: alpha(colors.primary, 0.12),
    },
    // Cores customizadas
    custom: {
      foreground: colors.foreground,
      secondary: colors.secondary,
      secondaryForeground: colors.secondaryForeground,
      destructive: '#ef4444',
      destructiveForeground: '#ffffff',
      muted: colors.muted,
      mutedForeground: colors.mutedForeground,
      accent: colors.accent,
      accentForeground: colors.accentForeground,
      popover: colors.popover,
      popoverForeground: colors.popoverForeground,
      card: colors.card,
      cardForeground: colors.cardForeground,
      border: colors.border,
      input: colors.input,
      ring: colors.ring,
      chart: {
        1: colors.chart1,
        2: colors.chart2,
        3: colors.chart3,
        4: colors.chart4,
        5: colors.chart5,
      },
      sidebar: colors.sidebar,
    },
  };
};

// Componentes com estilos padrão - Dark mode only
const createComponents = (): Components<Omit<Theme, 'components'>> => {
  return {
    // ==================== BASE ====================
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.3), hsla(0, 0%, 100%, 0))',
          backgroundAttachment: 'fixed',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          overscrollBehavior: 'none',
        },
        '*::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
          borderRadius: '3px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: colors.border,
          borderRadius: '3px',
          transition: 'background-color 0.2s',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: alpha(colors.mutedForeground, 0.5),
        },
      },
    },

    // ==================== BUTTONS ====================
    MuiButton: {
      defaultProps: {
        disableElevation: false,
        variant: 'contained',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          textTransform: 'none',
          fontWeight: typographyTokens.fontWeight.medium,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: shadowTokens.sm,
          '&:hover': {
            boxShadow: shadowTokens.md,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.9),
          },
        },
        containedSecondary: {
          backgroundColor: colors.secondary,
          color: colors.secondaryForeground,
          '&:hover': {
            backgroundColor: alpha(colors.secondary, 0.9),
          },
        },
        containedError: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#dc2626',
          },
        },
        containedSuccess: {
          backgroundColor: '#10b981',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#059669',
          },
        },
        containedWarning: {
          backgroundColor: '#f59e0b',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#d97706',
          },
        },
        containedInfo: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#2563eb',
          },
        },
        outlined: {
          borderColor: colors.border,
          color: colors.foreground,
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: alpha(colors.primary, 0.04),
            transform: 'translateY(-1px)',
          },
        },
        outlinedPrimary: {
          borderColor: colors.primary,
          color: colors.primary,
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: alpha(colors.primary, 0.08),
          },
        },
        outlinedSecondary: {
          borderColor: colors.border,
          color: colors.foreground,
          '&:hover': {
            borderColor: colors.primary,
            backgroundColor: alpha(colors.secondary, 0.08),
          },
        },
        outlinedError: {
          borderColor: '#ef4444',
          color: '#ef4444',
          '&:hover': {
            borderColor: '#dc2626',
            backgroundColor: alpha('#ef4444', 0.08),
          },
        },
        outlinedSuccess: {
          borderColor: '#10b981',
          color: '#10b981',
          '&:hover': {
            borderColor: '#059669',
            backgroundColor: alpha('#10b981', 0.08),
          },
        },
        outlinedWarning: {
          borderColor: '#f59e0b',
          color: '#f59e0b',
          '&:hover': {
            borderColor: '#d97706',
            backgroundColor: alpha('#f59e0b', 0.08),
          },
        },
        outlinedInfo: {
          borderColor: '#3b82f6',
          color: '#3b82f6',
          '&:hover': {
            borderColor: '#2563eb',
            backgroundColor: alpha('#3b82f6', 0.08),
          },
        },
        text: {
          color: colors.foreground,
          '&:hover': {
            backgroundColor: alpha(colors.muted, 0.08),
          },
        },
        textPrimary: {
          color: colors.primary,
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.08),
          },
        },
        textError: {
          color: '#ef4444',
          '&:hover': {
            backgroundColor: alpha('#ef4444', 0.08),
          },
        },
        textSuccess: {
          color: '#10b981',
          '&:hover': {
            backgroundColor: alpha('#10b981', 0.08),
          },
        },
        textWarning: {
          color: '#f59e0b',
          '&:hover': {
            backgroundColor: alpha('#f59e0b', 0.08),
          },
        },
        textInfo: {
          color: '#3b82f6',
          '&:hover': {
            backgroundColor: alpha('#3b82f6', 0.08),
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: typographyTokens.fontSize.sm,
        },
        sizeMedium: {
          padding: '8px 20px',
          fontSize: typographyTokens.fontSize.sm,
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: typographyTokens.fontSize.base,
          borderRadius: radius.lg,
        },
      },
    },

    MuiIconButton: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          color: colors.foreground,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: alpha(colors.muted, 0.12),
          },
        },
        colorPrimary: {
          color: colors.primary,
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.12),
          },
        },
        colorSecondary: {
          color: colors.mutedForeground,
          '&:hover': {
            backgroundColor: alpha(colors.secondary, 0.12),
          },
        },
        colorError: {
          color: '#ef4444',
          '&:hover': {
            backgroundColor: alpha('#ef4444', 0.12),
          },
        },
        colorSuccess: {
          color: '#10b981',
          '&:hover': {
            backgroundColor: alpha('#10b981', 0.12),
          },
        },
        colorWarning: {
          color: '#f59e0b',
          '&:hover': {
            backgroundColor: alpha('#f59e0b', 0.12),
          },
        },
        colorInfo: {
          color: '#3b82f6',
          '&:hover': {
            backgroundColor: alpha('#3b82f6', 0.12),
          },
        },
        sizeSmall: {
          padding: '8px',
        },
        sizeMedium: {
          padding: '10px',
        },
        sizeLarge: {
          padding: '12px',
        },
      },
    },

    MuiFab: {
      defaultProps: {
        size: 'medium',
        color: 'primary',
      },
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          boxShadow: shadowTokens.lg,
          '&:hover': {
            boxShadow: shadowTokens.xl,
          },
        },
        primary: {
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.9),
          },
        },
      },
    },

    // ==================== INPUTS ====================
    MuiTextField: {
      defaultProps: {
        size: 'medium',
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: radius.md,
          },
        },
      },
    },

    MuiOutlinedInput: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(colors.primary, 0.5),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary,
            borderWidth: '2px',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.destructive,
          },
        },
        notchedOutline: {
          borderColor: colors.border,
          transition: 'border-color 0.2s ease-in-out',
        },
        input: {
          padding: '10px 14px',
          '&::placeholder': {
            color: colors.mutedForeground,
            opacity: 0.7,
          },
        },
        inputSizeSmall: {
          padding: '8px 12px',
        },
      },
    },

    MuiInputBase: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          color: colors.foreground,
          fontSize: typographyTokens.fontSize.sm,
        },
        input: {
          '&::placeholder': {
            color: colors.mutedForeground,
            opacity: 0.7,
          },
        },
      },
    },

    MuiInputLabel: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          color: colors.mutedForeground,
          fontWeight: typographyTokens.fontWeight.medium,
          fontSize: typographyTokens.fontSize.sm,
          '&.Mui-focused': {
            color: colors.primary,
          },
          '&.Mui-error': {
            color: colors.destructive,
          },
        },
        sizeSmall: {
          fontSize: typographyTokens.fontSize.sm,
        },
      },
    },

    MuiFormControl: {
      defaultProps: {
        size: 'medium',
        fullWidth: true,
        margin: 'normal',
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: colors.foreground,
          fontWeight: typographyTokens.fontWeight.medium,
          '&.Mui-focused': {
            color: colors.primary,
          },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: typographyTokens.fontSize.xs,
          marginTop: '4px',
          color: colors.mutedForeground,
          '&.Mui-error': {
            color: colors.destructive,
          },
        },
      },
    },

    MuiSelect: {
      defaultProps: {
        size: 'medium',
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
        },
        select: {
          padding: '8px 12px',
        },
        icon: {
          color: colors.mutedForeground,
          transition: 'transform 0.2s ease-in-out',
        },
      },
    },

    MuiAutocomplete: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: radius.md,
          },
        },
        paper: {
          borderRadius: radius.md,
          boxShadow: shadowTokens.lg,
          border: `1px solid ${colors.border}`,
        },
        listbox: {
          padding: '4px',
        },
        option: {
          borderRadius: radius.sm,
          margin: '2px 4px',
          '&[aria-selected="true"]': {
            backgroundColor: alpha(colors.primary, 0.12),
          },
          '&.Mui-focused': {
            backgroundColor: alpha(colors.muted, 0.08),
          },
        },
      },
    },

    MuiFilledInput: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: `${radius.md} ${radius.md} 0 0`,
          backgroundColor: alpha(colors.muted, 0.08),
          '&:hover': {
            backgroundColor: alpha(colors.muted, 0.12),
          },
          '&.Mui-focused': {
            backgroundColor: alpha(colors.muted, 0.12),
          },
        },
      },
    },

    MuiSwitch: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          padding: '8px',
        },
        switchBase: {
          '&.Mui-checked': {
            color: colors.primaryForeground,
            '& + .MuiSwitch-track': {
              backgroundColor: colors.primary,
              opacity: 1,
            },
          },
        },
        track: {
          backgroundColor: colors.border,
          opacity: 1,
        },
        thumb: {
          boxShadow: shadowTokens.sm,
        },
      },
    },

    MuiCheckbox: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          color: colors.border,
          '&.Mui-checked': {
            color: colors.primary,
          },
        },
      },
    },

    MuiRadio: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          color: colors.border,
          '&.Mui-checked': {
            color: colors.primary,
          },
        },
      },
    },

    MuiSlider: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          color: colors.primary,
        },
        thumb: {
          boxShadow: shadowTokens.sm,
          '&:hover': {
            boxShadow: `0 0 0 8px ${alpha(colors.primary, 0.16)}`,
          },
        },
        track: {
          backgroundColor: colors.primary,
        },
        rail: {
          backgroundColor: colors.border,
        },
      },
    },

    // ==================== CARDS & PAPER ====================
    MuiCard: {
      defaultProps: {
        variant: 'elevation',
        elevation: 1,
      },
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          color: colors.cardForeground,
          backgroundImage: 'none',
          boxShadow: shadowTokens.base,
          border: `1px solid ${colors.border}`,
          transition: 'all 0.2s ease-in-out',
        },
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
        title: {
          fontSize: typographyTokens.fontSize.lg,
          fontWeight: typographyTokens.fontWeight.semibold,
          color: colors.foreground,
        },
        subheader: {
          fontSize: typographyTokens.fontSize.sm,
          color: colors.mutedForeground,
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },

    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          gap: '8px',
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.card,
          color: colors.foreground,
        },
        rounded: {
          borderRadius: radius.lg,
        },
        outlined: {
          borderColor: colors.border,
        },
        elevation1: {
          boxShadow: shadowTokens.sm,
        },
        elevation2: {
          boxShadow: shadowTokens.base,
        },
        elevation3: {
          boxShadow: shadowTokens.md,
        },
        elevation4: {
          boxShadow: shadowTokens.lg,
        },
      },
    },

    // ==================== DIALOGS & MODALS ====================
    MuiDialog: {
      defaultProps: {
        scroll: 'body',
        maxWidth: 'sm',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiDialog-container': {
            alignItems: 'flex-start',
            paddingTop: '32px',
            paddingBottom: '32px',
          },
        },
        paper: {
          borderRadius: radius.lg,
          margin: '0 16px',
          backgroundColor: colors.card,
          backgroundImage: 'none',
          border: `1px solid ${colors.border}`,
          boxShadow: shadowTokens.xl,
        },
        paperScrollBody: {
          maxHeight: 'none',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: typographyTokens.fontWeight.semibold,
          fontSize: typographyTokens.fontSize.xl,
          color: colors.foreground,
          padding: '20px 24px 12px',
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '12px 24px',
          color: colors.foreground,
        },
      },
    },

    MuiDialogContentText: {
      styleOverrides: {
        root: {
          color: colors.mutedForeground,
          fontSize: typographyTokens.fontSize.sm,
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          gap: '12px',
          '& > :not(:first-of-type)': {
            marginLeft: 0,
          },
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.card,
          backgroundImage: 'none',
          borderColor: colors.border,
        },
      },
    },

    MuiModal: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backgroundColor: alpha(colors.background, 0.8),
          },
        },
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.background, 0.8),
        },
      },
    },

    // ==================== MENUS & POPOVERS ====================
    MuiMenu: {
      defaultProps: {
        elevation: 4,
      },
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          boxShadow: shadowTokens.lg,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.popover,
          backgroundImage: 'none',
        },
        list: {
          padding: '4px',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          margin: '2px 4px',
          padding: '8px 12px',
          fontSize: typographyTokens.fontSize.sm,
          color: colors.foreground,
          '&:hover': {
            backgroundColor: alpha(colors.muted, 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary, 0.12),
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.16),
            },
          },
        },
      },
    },

    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          boxShadow: shadowTokens.lg,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.popover,
          backgroundImage: 'none',
        },
      },
    },

    // ==================== LISTS ====================
    MuiList: {
      styleOverrides: {
        root: {
          padding: '4px',
        },
      },
    },

    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          '&:hover': {
            backgroundColor: alpha(colors.muted, 0.08),
          },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          padding: '8px 12px',
          '&:hover': {
            backgroundColor: alpha(colors.muted, 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary, 0.12),
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.16),
            },
          },
        },
      },
    },

    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: colors.foreground,
          fontSize: typographyTokens.fontSize.sm,
          fontWeight: typographyTokens.fontWeight.medium,
        },
        secondary: {
          color: colors.mutedForeground,
          fontSize: typographyTokens.fontSize.xs,
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: colors.mutedForeground,
          minWidth: '36px',
        },
      },
    },

    // ==================== CHIPS & BADGES ====================
    MuiChip: {
      defaultProps: {
        size: 'medium',
      },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          fontWeight: typographyTokens.fontWeight.medium,
          fontSize: typographyTokens.fontSize.xs,
        },
        filled: {
          backgroundColor: alpha(colors.muted, 0.2),
          color: colors.foreground,
        },
        filledPrimary: {
          backgroundColor: alpha(colors.primary, 0.15),
          color: colors.primary,
        },
        filledSecondary: {
          backgroundColor: alpha(colors.secondary, 0.15),
          color: colors.foreground,
        },
        colorSuccess: {
          backgroundColor: alpha('#10b981', 0.15),
          color: '#10b981',
        },
        colorError: {
          backgroundColor: alpha('#ef4444', 0.15),
          color: '#ef4444',
        },
        colorWarning: {
          backgroundColor: alpha('#f59e0b', 0.15),
          color: '#f59e0b',
        },
        outlined: {
          borderColor: colors.border,
          color: colors.foreground,
        },
        outlinedPrimary: {
          borderColor: colors.primary,
          color: colors.primary,
        },
        deleteIcon: {
          color: colors.mutedForeground,
          '&:hover': {
            color: colors.foreground,
          },
        },
        sizeSmall: {
          height: '24px',
        },
        sizeMedium: {
          height: '32px',
        },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: typographyTokens.fontWeight.medium,
          fontSize: typographyTokens.fontSize.xs,
        },
        colorPrimary: {
          backgroundColor: colors.primary,
          color: '#ffffff',
        },
        colorError: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
        },
      },
    },

    // ==================== PROGRESS & LOADING ====================
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: radius.full,
          height: '8px',
          backgroundColor: alpha(colors.muted, 0.2),
        },
        bar: {
          borderRadius: radius.full,
        },
        colorPrimary: {
          backgroundColor: alpha(colors.primary, 0.2),
        },
        barColorPrimary: {
          backgroundColor: colors.primary,
        },
      },
    },

    MuiCircularProgress: {
      defaultProps: {
        size: 24,
      },
      styleOverrides: {
        colorPrimary: {
          color: colors.primary,
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.muted, 0.1),
        },
        rounded: {
          borderRadius: radius.md,
        },
      },
    },

    // ==================== TABS ====================
    MuiTabs: {
      defaultProps: {
        variant: 'scrollable',
        scrollButtons: 'auto',
      },
      styleOverrides: {
        root: {
          minHeight: '40px',
        },
        indicator: {
          backgroundColor: colors.primary,
          height: '2px',
          borderRadius: '2px 2px 0 0',
        },
        scrollButtons: {
          color: colors.mutedForeground,
          '&.Mui-disabled': {
            opacity: 0.3,
          },
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: typographyTokens.fontWeight.medium,
          fontSize: typographyTokens.fontSize.sm,
          minHeight: '40px',
          padding: '8px 16px',
          color: colors.mutedForeground,
          '&.Mui-selected': {
            color: colors.foreground,
          },
          '&:hover': {
            color: colors.foreground,
            backgroundColor: alpha(colors.muted, 0.04),
          },
        },
      },
    },

    // ==================== TABLES ====================
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: alpha(colors.muted, 0.05),
            color: colors.mutedForeground,
            fontWeight: typographyTokens.fontWeight.semibold,
            fontSize: typographyTokens.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: alpha(colors.muted, 0.04),
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
          padding: '12px 16px',
          fontSize: typographyTokens.fontSize.sm,
          color: colors.foreground,
        },
        head: {
          fontWeight: typographyTokens.fontWeight.semibold,
        },
        sizeSmall: {
          padding: '8px 12px',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        },
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: colors.foreground,
        },
        selectIcon: {
          color: colors.mutedForeground,
        },
        actions: {
          '& .MuiIconButton-root': {
            color: colors.foreground,
            '&.Mui-disabled': {
              color: colors.mutedForeground,
            },
          },
        },
      },
    },

    // ==================== ALERTS & NOTIFICATIONS ====================
    MuiAlert: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          fontSize: typographyTokens.fontSize.sm,
          color: colors.foreground,
        },
        filled: {
          fontWeight: typographyTokens.fontWeight.medium,
        },
        filledSuccess: {
          backgroundColor: '#10b981',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#ffffff',
          },
        },
        filledError: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#ffffff',
          },
        },
        filledWarning: {
          backgroundColor: '#f59e0b',
          color: '#000000',
          '& .MuiAlert-icon': {
            color: '#000000',
          },
        },
        filledInfo: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#ffffff',
          },
        },
        outlined: {
          borderWidth: '1px',
          backgroundColor: alpha(colors.card, 0.5),
        },
        outlinedSuccess: {
          borderColor: '#10b981',
          color: '#10b981',
          '& .MuiAlert-icon': {
            color: '#10b981',
          },
        },
        outlinedError: {
          borderColor: '#ef4444',
          color: '#ef4444',
          '& .MuiAlert-icon': {
            color: '#ef4444',
          },
        },
        outlinedWarning: {
          borderColor: '#f59e0b',
          color: '#f59e0b',
          '& .MuiAlert-icon': {
            color: '#f59e0b',
          },
        },
        outlinedInfo: {
          borderColor: '#3b82f6',
          color: '#3b82f6',
          '& .MuiAlert-icon': {
            color: '#3b82f6',
          },
        },
        standard: {
          backgroundColor: alpha(colors.muted, 0.15),
          color: colors.foreground,
        },
        standardSuccess: {
          backgroundColor: alpha('#10b981', 0.15),
          color: '#10b981',
          '& .MuiAlert-icon': {
            color: '#10b981',
          },
        },
        standardError: {
          backgroundColor: alpha('#ef4444', 0.15),
          color: '#ef4444',
          '& .MuiAlert-icon': {
            color: '#ef4444',
          },
        },
        standardWarning: {
          backgroundColor: alpha('#f59e0b', 0.15),
          color: '#f59e0b',
          '& .MuiAlert-icon': {
            color: '#f59e0b',
          },
        },
        standardInfo: {
          backgroundColor: alpha('#3b82f6', 0.15),
          color: '#3b82f6',
          '& .MuiAlert-icon': {
            color: '#3b82f6',
          },
        },
        icon: {
          opacity: 1,
        },
      },
    },

    MuiAlertTitle: {
      styleOverrides: {
        root: {
          fontWeight: typographyTokens.fontWeight.semibold,
          marginBottom: '4px',
        },
      },
    },

    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: radius.md,
            boxShadow: shadowTokens.lg,
          },
        },
      },
    },

    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: colors.card,
          color: colors.cardForeground,
          borderRadius: radius.md,
          boxShadow: shadowTokens.lg,
          padding: '12px 16px',
          border: `1px solid ${colors.border}`,
        },
        message: {
          padding: 0,
          fontSize: typographyTokens.fontSize.sm,
        },
        action: {
          paddingLeft: '16px',
          marginRight: 0,
        },
      },
    },

    // ==================== TOOLTIPS ====================
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.popover,
          color: colors.popoverForeground,
          borderRadius: radius.sm,
          fontSize: typographyTokens.fontSize.xs,
          fontWeight: typographyTokens.fontWeight.medium,
          padding: '6px 12px',
          boxShadow: shadowTokens.md,
          border: `1px solid ${colors.border}`,
        },
        arrow: {
          color: colors.popover,
          '&::before': {
            border: `1px solid ${colors.border}`,
          },
        },
      },
    },

    // ==================== AVATARS ====================
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.primary, 0.2),
          color: colors.primary,
          fontWeight: typographyTokens.fontWeight.medium,
        },
        colorDefault: {
          backgroundColor: alpha(colors.muted, 0.2),
          color: colors.foreground,
        },
      },
    },

    MuiAvatarGroup: {
      styleOverrides: {
        avatar: {
          borderColor: colors.card,
        },
      },
    },

    // ==================== DIVIDERS ====================
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
        },
      },
    },

    // ==================== APP BAR ====================
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'transparent',
      },
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.background, 0.8),
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: 'none',
        },
        colorPrimary: {
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
        },
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px',
        },
        dense: {
          minHeight: '48px',
        },
      },
    },

    // ==================== BREADCRUMBS ====================
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: typographyTokens.fontSize.sm,
        },
        separator: {
          color: colors.mutedForeground,
        },
        li: {
          color: colors.mutedForeground,
          '& a': {
            color: colors.mutedForeground,
            textDecoration: 'none',
            '&:hover': {
              color: colors.foreground,
            },
          },
          '&:last-child': {
            color: colors.foreground,
          },
        },
      },
    },

    // ==================== ACCORDION ====================
    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0 16px',
          minHeight: '48px',
          '&.Mui-expanded': {
            minHeight: '48px',
          },
        },
        content: {
          margin: '12px 0',
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
        expandIconWrapper: {
          color: colors.mutedForeground,
        },
      },
    },

    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 16px 16px',
        },
      },
    },

    // ==================== STEPPER ====================
    MuiStepper: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },

    MuiStep: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },

    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: typographyTokens.fontSize.sm,
          fontWeight: typographyTokens.fontWeight.medium,
          color: colors.mutedForeground,
          '&.Mui-active': {
            color: colors.foreground,
          },
          '&.Mui-completed': {
            color: colors.foreground,
          },
        },
      },
    },

    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: colors.border,
          '&.Mui-active': {
            color: colors.primary,
          },
          '&.Mui-completed': {
            color: colors.primary,
          },
        },
        text: {
          fill: colors.foreground,
          fontWeight: typographyTokens.fontWeight.medium,
        },
      },
    },

    // ==================== RATING ====================
    MuiRating: {
      styleOverrides: {
        root: {
          color: colors.chart4,
        },
        iconEmpty: {
          color: colors.border,
        },
      },
    },

    // ==================== PAGINATION ====================
    MuiPagination: {
      defaultProps: {
        shape: 'rounded',
        size: 'medium',
      },
    },

    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          color: colors.foreground,
          '&.Mui-selected': {
            backgroundColor: colors.primary,
            color: colors.primaryForeground,
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.9),
            },
          },
        },
        outlined: {
          borderColor: colors.border,
        },
      },
    },

    // ==================== TOGGLE BUTTON ====================
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          borderColor: colors.border,
          color: colors.foreground,
          textTransform: 'none',
          fontWeight: typographyTokens.fontWeight.medium,
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary, 0.12),
            color: colors.primary,
            borderColor: colors.primary,
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.16),
            },
          },
        },
      },
    },

    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
        },
      },
    },

    // ==================== LINK ====================
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
      styleOverrides: {
        root: {
          color: colors.primary,
          fontWeight: typographyTokens.fontWeight.medium,
          '&:hover': {
            color: alpha(colors.primary, 0.8),
          },
        },
      },
    },

    // ==================== TYPOGRAPHY ====================
    MuiTypography: {
      styleOverrides: {
        root: {
          color: colors.foreground,
        },
        h1: { color: colors.foreground },
        h2: { color: colors.foreground },
        h3: { color: colors.foreground },
        h4: { color: colors.foreground },
        h5: { color: colors.foreground },
        h6: { color: colors.foreground },
        body1: { color: colors.foreground },
        body2: { color: colors.mutedForeground },
        caption: { color: colors.mutedForeground },
        subtitle1: { color: colors.foreground },
        subtitle2: { color: colors.mutedForeground },
      },
    },
  };
};

// Tema base - Dark mode only
const getThemeOptions = (): ThemeOptions => ({
  palette: createPalette(),

  typography: {
    fontFamily: typographyTokens.fontFamily,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: typographyTokens.fontWeight.normal,
    fontWeightMedium: typographyTokens.fontWeight.medium,
    fontWeightBold: typographyTokens.fontWeight.bold,
    h1: {
      fontSize: typographyTokens.fontSize['5xl'],
      fontWeight: typographyTokens.fontWeight.bold,
      lineHeight: typographyTokens.lineHeight.tight,
    },
    h2: {
      fontSize: typographyTokens.fontSize['4xl'],
      fontWeight: typographyTokens.fontWeight.bold,
      lineHeight: typographyTokens.lineHeight.tight,
    },
    h3: {
      fontSize: typographyTokens.fontSize['3xl'],
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: typographyTokens.lineHeight.tight,
    },
    h4: {
      fontSize: typographyTokens.fontSize['2xl'],
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: typographyTokens.lineHeight.normal,
    },
    h5: {
      fontSize: typographyTokens.fontSize.xl,
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: typographyTokens.lineHeight.normal,
    },
    h6: {
      fontSize: typographyTokens.fontSize.lg,
      fontWeight: typographyTokens.fontWeight.medium,
      lineHeight: typographyTokens.lineHeight.normal,
    },
    body1: {
      fontSize: typographyTokens.fontSize.base,
      lineHeight: typographyTokens.lineHeight.normal,
    },
    body2: {
      fontSize: typographyTokens.fontSize.sm,
      lineHeight: typographyTokens.lineHeight.normal,
    },
    caption: {
      fontSize: typographyTokens.fontSize.xs,
      lineHeight: typographyTokens.lineHeight.normal,
    },
    button: {
      textTransform: 'none',
      fontWeight: typographyTokens.fontWeight.medium,
      fontSize: typographyTokens.fontSize.sm,
    },
  },

  spacing: (factor: number) => `${factor * 0.25}rem`,

  shape: {
    borderRadius: 12,
  },

  breakpoints: {
    values: {
      xs: breakpointsTokens.xs,
      sm: breakpointsTokens.sm,
      md: breakpointsTokens.md,
      lg: breakpointsTokens.lg,
      xl: breakpointsTokens.xl,
    },
  },

  shadows: [
    'none',
    shadowTokens.sm,
    shadowTokens.base,
    shadowTokens.base,
    shadowTokens.md,
    shadowTokens.md,
    shadowTokens.md,
    shadowTokens.lg,
    shadowTokens.lg,
    shadowTokens.lg,
    shadowTokens.xl,
    shadowTokens.xl,
    shadowTokens.xl,
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
    shadowTokens['2xl'],
  ],

  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: zIndexTokens.fixed,
    drawer: zIndexTokens.offcanvas,
    modal: zIndexTokens.modal,
    snackbar: 1400,
    tooltip: zIndexTokens.tooltip,
  },

  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  components: createComponents(),
});

// Criar tema dark (único tema do projeto)
export const themeDark = createTheme(getThemeOptions());

// Função helper para obter tema (sempre retorna dark)
export const getTheme = () => themeDark;

// Exportar tema padrão (dark)
export default themeDark;

// Type augmentation para adicionar cores customizadas
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      foreground: string;
      secondary: string;
      secondaryForeground: string;
      destructive: string;
      destructiveForeground: string;
      muted: string;
      mutedForeground: string;
      accent: string;
      accentForeground: string;
      popover: string;
      popoverForeground: string;
      card: string;
      cardForeground: string;
      border: string;
      input: string;
      ring: string;
      chart: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
      };
      sidebar: {
        background: string;
        foreground: string;
        primary: string;
        primaryForeground: string;
        accent: string;
        accentForeground: string;
        border: string;
        ring: string;
      };
    };
  }

  interface PaletteOptions {
    custom?: {
      foreground?: string;
      secondary?: string;
      secondaryForeground?: string;
      destructive?: string;
      destructiveForeground?: string;
      muted?: string;
      mutedForeground?: string;
      accent?: string;
      accentForeground?: string;
      popover?: string;
      popoverForeground?: string;
      card?: string;
      cardForeground?: string;
      border?: string;
      input?: string;
      ring?: string;
      chart?: {
        1?: string;
        2?: string;
        3?: string;
        4?: string;
        5?: string;
      };
      sidebar?: {
        background?: string;
        foreground?: string;
        primary?: string;
        primaryForeground?: string;
        accent?: string;
        accentForeground?: string;
        border?: string;
        ring?: string;
      };
    };
  }
}
