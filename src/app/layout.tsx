import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Home, BarChart2, History, Settings, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { AppNav } from '@/components/app-nav';

export const metadata: Metadata = {
  title: 'FinWise Dashboard',
  description: 'Gerencie suas finanças com facilidade.',
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
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarHeader>
                <div className="flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="text-primary hover:bg-accent -ml-2">
                    <Wallet className="size-5" />
                  </Button>
                  <h2 className="text-lg font-semibold text-primary">FinWise</h2>
                </div>
              </SidebarHeader>
              <AppNav />
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <div className="md:hidden p-4 flex justify-between items-center bg-card border-b">
                <div className="flex items-center gap-2">
                    <Wallet className="size-6 text-primary" />
                    <h2 className="text-xl font-bold text-primary">FinWise</h2>
                </div>
                <SidebarTrigger />
            </div>
            {children}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
