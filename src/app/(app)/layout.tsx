'use client';

import { useAuth } from "@/hooks/use-auth";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "../user-nav";
import { Logo } from "@/components/logo";
import { AppNav } from "../app-nav";
import { PWAUpdater } from "@/components/pwa-updater";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatAssistant } from "@/components/chat/chat-assistant";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TransactionsProvider } from "@/hooks/use-transactions";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se a autenticação terminou e NÃO HÁ usuário,
    // redirecione-os para a página de login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Enquanto carrega ou se não houver usuário, mostre uma tela de carregamento em tela cheia.
  // Isso evita um flash do painel.
  if (loading || !user) {
    return (
       <div className="flex items-center justify-center h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
             <Logo className="h-12 w-12 text-primary" />
             <Skeleton className="h-4 w-48" />
          </div>
       </div>
    );
  }
  
  // Se o carregamento estiver completo e tivermos um usuário, renderize o layout do painel.
  return (
      <TransactionsProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen">
              <Sidebar className="flex flex-col">
                  <SidebarHeader>
                      <div className="flex items-center justify-center h-12 group-data-[state=expanded]:justify-start group-data-[state=expanded]:gap-2">
                          <Logo className="w-8 h-auto"/>
                          <span className="text-lg font-semibold group-data-[state=collapsed]:hidden">FinWise</span>
                      </div>
                  </SidebarHeader>
                  <SidebarContent className="flex-1 p-3">
                     <ScrollArea className="h-full">
                        <AppNav />
                     </ScrollArea>
                  </SidebarContent>
                  <SidebarFooter>
                      <UserNav />
                  </SidebarFooter>
              </Sidebar>
              <main className="flex-1">
                  <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 md:hidden">
                      <div className="flex items-center gap-2">
                          <SidebarTrigger/>
                          <Logo className="w-8 h-8"/>
                      </div>
                      <div className="flex-1">
                          {/* O título da página pode ir aqui */}
                      </div>
                      <UserNav />
                  </header>
                  <ScrollArea className="h-[calc(100vh-theme(space.14))] md:h-screen">
                    <div className="flex-1 p-4 md:p-6">
                        {children}
                    </div>
                  </ScrollArea>
                  <PWAUpdater />
                  <ChatAssistant />
              </main>
          </div>
        </SidebarProvider>
      </TransactionsProvider>
  );
}
