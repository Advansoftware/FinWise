"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { Home, History, Settings, FolderKanban, Upload, Gem, UserCircle, Target, Goal, Wallet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
    { href: '/dashboard', label: 'Painel', icon: Home },
    { href: '/transactions', label: 'Transações', icon: History },
    { href: '/wallets', label: 'Carteiras', icon: Wallet },
    { href: '/categories', label: 'Categorias', icon: FolderKanban },
    { href: '/budgets', label: 'Orçamentos', icon: Target },
    { href: '/goals', label: 'Metas', icon: Goal },
    { href: '/reports', label: 'Relatórios', icon: FileText },
    { href: '/import', label: 'Importar', icon: Upload },
    { href: '/settings', label: 'Configurações', icon: Settings },
    { href: '/billing', label: 'Assinatura', icon: Gem },
    { href: '/profile', label: 'Perfil', icon: UserCircle },
];

export function AppNav() {
    const pathname = usePathname();
    const { state, setOpenMobile } = useSidebar();
    const isMobile = useIsMobile();

    const handleNavClick = () => {
        // Fecha o sidebar apenas no mobile
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <SidebarMenu>
            {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                    <SidebarMenuItem key={item.href}>
                        <Link 
                            href={item.href} 
                            onClick={handleNavClick}
                            className={cn(
                                "flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-2"
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 ml-2 truncate group-data-[state=collapsed]:hidden">{item.label}</span>
                        </Link>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}