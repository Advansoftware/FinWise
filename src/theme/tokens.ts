// src/theme/tokens.ts
// Design tokens extraídos do Tailwind - Fonte única da verdade para o tema
// Após migração completa para MUI, este arquivo pode ser otimizado

/**
 * Converte valores HSL do CSS para formato RGB usado pelo MUI
 * Formato Tailwind: "262 84% 60%" -> Formato MUI: "rgb(150, 25, 244)"
 */
function hslToRgb(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Helper para converter HSL string "262 84% 60%" para RGB
 */
function parseHslToRgb(hslString: string): string {
  const [h, s, l] = hslString.split(' ').map((v, i) => {
    const num = parseFloat(v.replace('%', ''));
    return i === 0 ? num : num;
  });
  return hslToRgb(h, s, l);
}

// Cores modo escuro (padrão)
export const colorsDark = {
  background: parseHslToRgb('224 71% 4%'),
  foreground: parseHslToRgb('210 40% 98%'),
  card: parseHslToRgb('224 71% 6%'),
  cardForeground: parseHslToRgb('210 40% 98%'),
  popover: parseHslToRgb('224 71% 4%'),
  popoverForeground: parseHslToRgb('210 40% 98%'),
  primary: parseHslToRgb('262 84% 60%'),
  primaryForeground: parseHslToRgb('210 40% 98%'),
  secondary: parseHslToRgb('217 33% 17%'),
  secondaryForeground: parseHslToRgb('210 40% 98%'),
  muted: parseHslToRgb('217 33% 17%'),
  mutedForeground: parseHslToRgb('215 20% 65%'),
  accent: parseHslToRgb('217 33% 17%'),
  accentForeground: parseHslToRgb('210 40% 98%'),
  destructive: parseHslToRgb('0 63% 31%'),
  destructiveForeground: parseHslToRgb('210 40% 98%'),
  border: parseHslToRgb('217 33% 25%'),
  input: parseHslToRgb('217 33% 25%'),
  ring: parseHslToRgb('262 84% 60%'),
  chart1: parseHslToRgb('262 84% 60%'),
  chart2: parseHslToRgb('166 84% 60%'),
  chart3: parseHslToRgb('343 84% 60%'),
  chart4: parseHslToRgb('43 74% 66%'),
  chart5: parseHslToRgb('27 87% 67%'),
  sidebar: {
    background: parseHslToRgb('224 71% 4%'),
    foreground: parseHslToRgb('0 0% 98%'),
    primary: parseHslToRgb('0 0% 98%'),
    primaryForeground: parseHslToRgb('210 20% 15%'),
    accent: parseHslToRgb('217 33% 17%'),
    accentForeground: parseHslToRgb('0 0% 98%'),
    border: parseHslToRgb('217 33% 25%'),
    ring: parseHslToRgb('262 84% 60%'),
  },
};

// Cores modo claro
export const colorsLight = {
  background: parseHslToRgb('206 33% 96%'),
  foreground: parseHslToRgb('210 20% 15%'),
  card: parseHslToRgb('0 0% 100%'),
  cardForeground: parseHslToRgb('210 20% 15%'),
  popover: parseHslToRgb('0 0% 100%'),
  popoverForeground: parseHslToRgb('210 20% 15%'),
  primary: parseHslToRgb('260 90% 60%'),
  primaryForeground: parseHslToRgb('0 0% 98%'),
  secondary: parseHslToRgb('206 33% 92%'),
  secondaryForeground: parseHslToRgb('200 20% 37%'),
  muted: parseHslToRgb('206 33% 92%'),
  mutedForeground: parseHslToRgb('210 20% 45%'),
  accent: parseHslToRgb('260 90% 60%'),
  accentForeground: parseHslToRgb('0 0% 98%'),
  destructive: parseHslToRgb('0 84.2% 60.2%'),
  destructiveForeground: parseHslToRgb('0 0% 98%'),
  border: parseHslToRgb('200 20% 85%'),
  input: parseHslToRgb('200 20% 85%'),
  ring: parseHslToRgb('260 90% 60%'),
  chart1: parseHslToRgb('260 90% 60%'),
  chart2: parseHslToRgb('320 90% 60%'),
  chart3: parseHslToRgb('197 37% 24%'),
  chart4: parseHslToRgb('43 74% 66%'),
  chart5: parseHslToRgb('27 87% 67%'),
  sidebar: {
    background: parseHslToRgb('0 0% 100%'),
    foreground: parseHslToRgb('200 20% 37%'),
    primary: parseHslToRgb('200 20% 37%'),
    primaryForeground: parseHslToRgb('0 0% 98%'),
    accent: parseHslToRgb('206 33% 96%'),
    accentForeground: parseHslToRgb('200 20% 37%'),
    border: parseHslToRgb('200 20% 90%'),
    ring: parseHslToRgb('260 90% 60%'),
  },
};

// Tipografia
export const typography = {
  fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
  // Mapeamento aproximado de tamanhos Tailwind para MUI
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Espaçamentos (Tailwind usa 0.25rem como base, MUI usa 8px)
// Vamos usar 4px como base para manter compatibilidade: spacing(1) = 0.25rem
export const spacing = {
  unit: 4, // 4px = 0.25rem
  scale: (factor: number) => `${factor * 0.25}rem`,
};

// Border Radius
export const radius = {
  sm: '0.375rem',  // 6px (calc(0.5rem - 4px))
  md: '0.5rem',    // 8px (calc(0.5rem - 2px))
  lg: '0.5rem',    // 8px (padrão --radius)
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
};

// Sombras (extraídas do Tailwind padrão)
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  none: 'none',
};

// Breakpoints (do Tailwind)
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Z-index layers
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
};

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Exportar tudo como default também para facilitar import
export default {
  colorsDark,
  colorsLight,
  typography,
  spacing,
  radius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
};
