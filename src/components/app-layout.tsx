'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PWAUpdater } from './pwa-updater';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset } from './ui/sidebar';
import { Button } from './ui/button';
import { AppNav } from '../app/app-nav';
import { ChatAssistant } from './chat/chat-assistant';
import { UserNav } from '../app/user-nav';
import { Logo } from './logo';
import { AnimatePresence, motion } from 'framer-motion';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isPublicOrAuthPage = ['/', '/login', '/signup'].includes(pathname);

  if (loading && !isPublicOrAuthPage) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-screen w-full flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { delay: 0.2, duration: 0.5, ease: 'easeOut' } }}
            className="w-24 h-24"
          >
            <Logo />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.5, duration: 0.5 } }}
            className="mt-4 text-lg font-medium text-primary"
          >
            FinWise
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isPublicOrAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
    // AuthProvider should handle the redirect, but this is a fallback.
    return null;
  }
  
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Painel';
    if (pathname.startsWith('/transactions')) return 'Transações';
    if (pathname.startsWith('/categories')) return 'Categorias';
    if (pathname.startsWith('/import')) return 'Importar';
    if (pathname.startsWith('/settings')) return 'Configurações';
    if (pathname.startsWith('/profile')) return 'Perfil';
    if (pathname.startsWith('/billing')) return 'Assinatura';
    return 'Painel'; // Fallback title
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
                    <div className="w-5 h-5"><Logo /></div>
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
               <div className="w-6 h-6"><Logo /></div>
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
