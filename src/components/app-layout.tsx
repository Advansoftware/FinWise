'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Wallet } from 'lucide-react';
import { PWAUpdater } from './pwa-updater';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset } from './ui/sidebar';
import { Button } from './ui/button';
import { AppNav } from './app-nav';
import { ChatAssistant } from './chat/chat-assistant';
import { UserNav } from './user-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
    // AuthProvider should handle the redirect, but this is a fallback.
    return null;
  }
  
  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Painel';
      case '/transactions': return 'Transações';
      case '/categories': return 'Categorias';
      case '/import': return 'Importar';
      case '/settings': return 'Configurações';
      default: return 'Painel';
    }
  }


  return (
    <>
      <PWAUpdater />
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-primary hover:bg-accent -ml-2 h-8 w-8">
                    <Wallet className="size-5" />
                  </Button>
                  <h2 className="text-lg font-semibold text-foreground group-data-[state=collapsed]:hidden">FinWise</h2>
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
              {getPageTitle()}
            </div>
            <div className="ml-auto">
              <UserNav />
            </div>
          </header>
          {children}
          <ChatAssistant />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
