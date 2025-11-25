// src/components/layout/ResponsiveLayout.tsx
// Componente que decide qual layout usar baseado no tamanho da tela

"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const theme = useTheme();
  // Breakpoint md = 900px - abaixo disso é mobile
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Renderizar layout apropriado
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
