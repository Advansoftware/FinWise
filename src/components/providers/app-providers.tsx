"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/hooks/use-auth";
import { DataRefreshProvider } from "@/hooks/use-data-refresh";
import { ToastProvider } from "@/components/providers/toast-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { PWAUpdater } from "@/components/pwa-updater";
import ThemeRegistry from "@/components/theme-registry/theme-registry";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <QueryProvider>
          <DataRefreshProvider>
            <ThemeRegistry>
              <ToastProvider>{children}</ToastProvider>
            </ThemeRegistry>
            <PWAUpdater />
          </DataRefreshProvider>
        </QueryProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
