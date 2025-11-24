// src/theme/mui-theme.ts
'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';
import { colorsDark, colorsLight, typography as typographyTokens, radius, shadows as shadowTokens, breakpoints as breakpointsTokens, zIndex as zIndexTokens, transitions as transitionTokens } from './tokens';

// Detectar modo escuro (pode ser refinado com context posteriormente)
const getMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
};

// Criar paleta baseada no modo
const createPalette = (mode: 'light' | 'dark') => {
  const colors = mode === 'dark' ? colorsDark : colorsLight;

  return {
    mode,
    primary: {
      main: colors.primary,
      contrastText: colors.primaryForeground,
    },
    secondary: {
      main: colors.secondary,
      contrastText: colors.secondaryForeground,
    },
    error: {
      main: colors.destructive,
      contrastText: colors.destructiveForeground,
    },
    warning: {
      main: colors.chart4, // Usando chart4 como warning
      contrastText: colors.foreground,
    },
    info: {
      main: colors.chart2, // Usando chart2 como info
      contrastText: colors.foreground,
    },
    success: {
      main: colors.chart2, // Usando chart2 como success
      contrastText: colors.foreground,
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
      active: colors.primary,
      hover: alpha(colors.muted, 0.08),
      selected: alpha(colors.muted, 0.12),
      disabled: alpha(colors.mutedForeground, 0.3),
      disabledBackground: alpha(colors.muted, 0.12),
      focus: alpha(colors.ring, 0.12),
    },
    // Cores customizadas (não padrão MUI)
    custom: {
      foreground: colors.foreground,
      secondary: colors.secondary,
      secondaryForeground: colors.secondaryForeground,
      destructive: colors.destructive,
      destructiveForeground: colors.destructiveForeground,
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

// Tema base
const getThemeOptions = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: createPalette(mode),

  typography: {
    fontFamily: typographyTokens.fontFamily,
    fontSize: 16, // base
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
      textTransform: 'none', // Não transformar texto dos botões
      fontWeight: typographyTokens.fontWeight.medium,
    },
  },

  spacing: (factor: number) => `${factor * 0.25}rem`, // 1 = 0.25rem (compatível com Tailwind)

  shape: {
    borderRadius: parseFloat(radius.lg), // 8px padrão
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

  // SSR compatibility for useMediaQuery
  ...(typeof window === 'undefined' && {
    components: {
      MuiUseMediaQuery: {
        defaultProps: {
          ssrMatchMedia: (query: string) => ({
            matches: false,
          }),
        },
      },
    },
  }),

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

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: mode === 'dark'
            ? 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.3), hsla(0, 0%, 100%, 0))'
            : 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.15), hsla(0, 0%, 100%, 0))',
          backgroundAttachment: 'fixed',
          // PWA optimizations
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          overscrollBehavior: 'none',
        },
        // Scrollbars customizados
        '*::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
          borderRadius: '3px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: mode === 'dark' ? colorsDark.border : colorsLight.border,
          borderRadius: '3px',
          transition: 'background-color 0.2s',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: alpha(mode === 'dark' ? colorsDark.mutedForeground : colorsLight.mutedForeground, 0.5),
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.xl, // Mais arredondado (12px)
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
        outlined: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        sizeSmall: {
          borderRadius: radius.md, // 8px para botões pequenos
          padding: '6px 16px',
        },
        sizeMedium: {
          borderRadius: radius.xl, // 12px para botões médios
          padding: '8px 20px',
        },
        sizeLarge: {
          borderRadius: radius['2xl'], // 16px para botões grandes
          padding: '12px 28px',
          fontSize: typographyTokens.fontSize.base,
        },
      },
      defaultProps: {
        disableElevation: false,
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          boxShadow: shadowTokens.base,
          backgroundImage: 'none', // Remove gradiente padrão MUI
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: radius.lg,
        },
      },
    },

    MuiFormControl: {
      styleOverrides: {
        root: {
          marginBottom: '16px', // Espaçamento entre inputs
        },
      },
      defaultProps: {
        margin: 'normal', // Adiciona margin top e bottom por padrão
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '8px', // Espaçamento extra entre TextFields
          '& .MuiOutlinedInput-root': {
            borderRadius: radius.md,
          },
        },
      },
      defaultProps: {
        margin: 'normal', // margin top: 16px, margin bottom: 8px
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
        }),
        notchedOutline: ({ theme }) => ({
          borderColor: theme.palette.divider,
          transition: 'border-color 0.2s ease-in-out',
        }),
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover:not(.Mui-disabled):not(.Mui-error)': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, 0.5),
            },
          },
        }),
      },
    },

    MuiFilledInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
          '&.Mui-focused': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }),
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: radius.sm,
          fontSize: typographyTokens.fontSize.xs,
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: shadowTokens.sm,
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
          backgroundColor: mode === 'dark' ? colorsDark.card : colorsLight.card,
          color: mode === 'dark' ? colorsDark.cardForeground : colorsLight.cardForeground,
          borderRadius: radius.md,
          boxShadow: shadowTokens.lg,
          padding: '12px 16px',
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
  },
});

// Criar tema dark (padrão)
export const themeDark = createTheme(getThemeOptions('dark'));

// Criar tema light
export const themeLight = createTheme(getThemeOptions('light'));

// Função helper para obter tema baseado no modo
export const getTheme = (mode?: 'light' | 'dark') => {
  const currentMode = mode || getMode();
  return currentMode === 'dark' ? themeDark : themeLight;
};

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
