'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { AppNav } from '@/app/app-nav';
import { UserNav } from '@/app/user-nav';
import { Logo } from '@/components/logo';
import { ChatAssistant } from '@/components/chat/chat-assistant';
import { PWAUpdater } from '@/components/pwa-updater';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPages = ['/login', '/signup', '/'];

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, e a rota não é pública, redireciona para o login
    if (!loading && !user && !publicPages.includes(pathname)) {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // Enquanto está carregando o estado de autenticação, mostra um loader
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-16 w-16">
          <Logo />
        </div>
      </div>
    );
  }
  
  // Se não há usuário e a página não é pública, não renderiza nada para esperar o redirect
  if (!user && !publicPages.includes(pathname)) {
      return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="border-r">
            <SidebarHeader>
                 <div className="h-12 w-12 mx-auto">
                    <Logo />
                 </div>
            </SidebarHeader>
            <SidebarContent>
                <AppNav />
            </SidebarContent>
            <SidebarFooter>
                <UserNav />
            </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <main className="flex-1 bg-background/95">
            {children}
          </main>
          <ChatAssistant />
        </SidebarInset>
        <PWAUpdater />
      </div>
    </SidebarProvider>
  );
}
