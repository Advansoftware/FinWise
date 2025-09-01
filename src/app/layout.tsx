import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Home, BarChart2, History, Settings, Wallet, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { AppNav } from '@/components/app-nav';
import { PWAUpdater } from '@/components/pwa-updater';

export const metadata: Metadata = {
  title: 'FinWise Dashboard',
  description: 'Gerencie suas finanças com facilidade.',
  manifest: '/manifest.json',
  themeColor: '#09090B'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
      </head>
      <body className="font-body antialiased">
        <PWAUpdater />
        <SidebarProvider defaultOpen={false}>
          <Sidebar>
            <SidebarContent>
              <SidebarHeader>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-accent -ml-2 h-8 w-8">
                            <Wallet className="size-5" />
                        </Button>
                        <h2 className="text-lg font-semibold text-foreground">FinWise</h2>
                   </div>
                   <SidebarTrigger className="hidden md:flex" />
                </div>
              </SidebarHeader>
              <AppNav />
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                <div className="flex items-center gap-2 md:hidden">
                    <SidebarTrigger />
                    <Wallet className="size-6 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">FinWise</h2>
                </div>
                <div className="hidden md:flex text-lg font-semibold">
                    Painel
                </div>
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
