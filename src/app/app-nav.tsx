"use client"

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar} from '@/components/mui-wrappers/sidebar';
import {Home, History, Settings, FolderKanban, Upload, Gem, UserCircle, Target, Goal, Wallet, FileText, CreditCard, Calculator} from 'lucide-react';
import {useIsMobile} from '@/hooks/use-mobile';

const navItems = [
    { href: '/dashboard', label: 'Painel', icon: Home },
    { href: '/transactions', label: 'Transações', icon: History },
    { href: '/wallets', label: 'Carteiras', icon: Wallet },
    { href: '/categories', label: 'Categorias', icon: FolderKanban },
    { href: '/budgets', label: 'Orçamentos', icon: Target },
    { href: '/goals', label: 'Metas', icon: Goal },
    { href: '/installments', label: 'Parcelamentos', icon: CreditCard },
    { href: '/reports', label: 'Relatórios', icon: FileText },
    { href: '/tools', label: 'Ferramentas', icon: Calculator },
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
                        <SidebarMenuButton isActive={isActive} onClick={handleNavClick}>
                            <Link href={item.href} style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
                                <item.icon style={{ width: '1rem', height: '1rem' }} />
                                {state === 'expanded' && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}