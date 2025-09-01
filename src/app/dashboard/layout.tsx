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


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
       <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
             <Logo className="h-12 w-12 text-primary" />
             <Skeleton className="h-4 w-48" />
          </div>
       </div>
    );
  }
  
  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
             <div className="flex items-center gap-2">
                <Logo />
                <span className="text-lg font-semibold group-data-[state=collapsed]:hidden">FinWise</span>
             </div>
          </SidebarHeader>
          <SidebarContent>
            <AppNav />
          </SidebarContent>
          <SidebarFooter>
            <UserNav />
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                <div className="flex items-center gap-2 md:hidden">
                    <SidebarTrigger/>
                    <Logo className="w-8 h-8"/>
                </div>
                <div className="flex-1">
                    {/* Page Title could go here */}
                </div>
                {/* Header actions can go here */}
            </header>
            <div className="flex-1 p-4 md:p-6">
                {children}
            </div>
            <PWAUpdater />
            <ChatAssistant />
        </main>
      </SidebarProvider>
  );
}
