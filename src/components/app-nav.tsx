"use client"

import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, History, Settings, FolderKanban, Upload } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
    { href: '/', label: 'Painel', icon: Home },
    { href: '/transactions', label: 'Transações', icon: History },
    { href: '/categories', label: 'Categorias', icon: FolderKanban },
    { href: '/import', label: 'Importar', icon: Upload },
    { href: '/settings', label: 'Configurações', icon: Settings },
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
                                 <SidebarMenuButton href={item.href} isActive={pathname === item.href}>
                                    <item.icon />
                                    <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
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
