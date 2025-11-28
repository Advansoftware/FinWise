// src/theme/MuiThemeProvider.tsx
"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import EmotionCacheProvider from "./EmotionCacheProvider";
import { themeDark } from "./mui-theme";

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <EmotionCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={themeDark}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </EmotionCacheProvider>
  );
}
