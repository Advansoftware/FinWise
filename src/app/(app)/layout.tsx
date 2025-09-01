
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading and there is NO user,
    // redirect them to the login page.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // While loading or if there's no user, show a full-screen loader.
  // This prevents a flash of the dashboard.
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
  
  // If loading is complete and we have a user, render the dashboard layout.
  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
             <div className="flex items-center gap-2">
                <Logo />
                <span className="text-lg font-semibold group-data-[state=expanded]:hidden">FinWise</span>
             </div>
          </SidebarHeader>
          <SidebarContent>
            <AppNav />
          </SidebarContent>
          <SidebarFooter>
            <UserNav />
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 md:ml-[var(--sidebar-width-icon)] group-data-[state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] duration-300 ease-in-out">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                <div className="flex items-center gap-2 md:hidden">
                    <SidebarTrigger/>
                    <Logo className="w-8 h-8"/>
                </div>
                <div className="flex-1">
                    {/* Page Title could go here */}
                </div>
                <UserNav />
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
