"use client"

import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, History, Settings, FolderKanban, Upload, Gem } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
    { href: '/dashboard', label: 'Painel', icon: Home },
    { href: '/transactions', label: 'Transações', icon: History },
    { href: '/categories', label: 'Categorias', icon: FolderKanban },
    { href: '/import', label: 'Importar', icon: Upload },
    { href: '/settings', label: 'Configurações', icon: Settings },
    { href: '/billing', label: 'Assinatura', icon: Gem },
];

export function AppNav() {
    const pathname = usePathname();
    const { state } = useSidebar();

    return (
        <SidebarMenu>
            {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                     <TooltipProvider>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                 <SidebarMenuButton 
                                    href={item.href} 
                                    isActive={pathname.startsWith(item.href)}
                                >
                                    <div className="flex items-center justify-center w-full">
                                      <item.icon className="h-4 w-4 shrink-0" />
                                      <span className="flex-1 ml-2 truncate group-data-[state=collapsed]:hidden">{item.label}</span>
                                    </div>
                                </SidebarMenuButton>
                            </TooltipTrigger>
                            {state === 'collapsed' && (
                                <TooltipContent side="right" align="center">
                                    {item.label}
                                </TooltipContent>
                            )}
                         </Tooltip>
                     </TooltipProvider>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
