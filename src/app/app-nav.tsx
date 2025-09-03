"use client"

import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, History, Settings, FolderKanban, Upload, Gem, UserCircle, Target } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
    { href: '/dashboard', label: 'Painel', icon: Home },
    { href: '/transactions', label: 'Transações', icon: History },
    { href: '/categories', label: 'Categorias', icon: FolderKanban },
    { href: '/budgets', label: 'Orçamentos', icon: Target },
    { href: '/import', label: 'Importar', icon: Upload },
    { href: '/settings', label: 'Configurações', icon: Settings },
    { href: '/billing', label: 'Assinatura', icon: Gem },
    { href: '/profile', label: 'Perfil', icon: UserCircle },
];

export function AppNav() {
    const pathname = usePathname();
    const { state } = useSidebar();

    return (
        <SidebarMenu>
            {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                     <SidebarMenuButton 
                        href={item.href} 
                        isActive={pathname === item.href}
                        tooltip={{children: item.label, side: "right", align: "center"}}
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 ml-2 truncate group-data-[state=collapsed]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
