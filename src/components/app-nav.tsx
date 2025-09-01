"use client"

import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, History, Settings, FolderKanban } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Painel', icon: Home },
    { href: '/transactions', label: 'Transações', icon: History },
    { href: '/categories', label: 'Categorias', icon: FolderKanban },
    { href: '/settings', label: 'Configurações', icon: Settings },
];

export function AppNav() {
    const pathname = usePathname();

    return (
        <SidebarMenu>
            {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton href={item.href} isActive={pathname === item.href}>
                        <item.icon />
                        {item.label}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
