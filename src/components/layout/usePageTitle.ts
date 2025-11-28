// src/components/layout/usePageTitle.ts
// Hook para obter o título da página atual baseado na rota

import { usePathname } from 'next/navigation';

interface PageInfo {
  title: string;
  icon?: string;
}

const pageTitles: Record<string, PageInfo> = {
  '/dashboard': { title: 'Painel' },
  '/transactions': { title: 'Transações' },
  '/wallets': { title: 'Carteiras' },
  '/categories': { title: 'Categorias' },
  '/budgets': { title: 'Orçamentos' },
  '/goals': { title: 'Metas' },
  '/installments': { title: 'Parcelamentos' },
  '/reports': { title: 'Relatórios' },
  '/payments': { title: 'Pagamentos' },
  '/tools': { title: 'Ferramentas' },
  '/import': { title: 'Importar' },
  '/profile': { title: 'Perfil' },
  '/settings': { title: 'Configurações' },
  '/billing': { title: 'Assinatura' },
};

export function usePageTitle(): PageInfo {
  const pathname = usePathname();

  // Verificar correspondência exata primeiro
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Verificar correspondência parcial (para rotas aninhadas)
  for (const [route, info] of Object.entries(pageTitles)) {
    if (pathname.startsWith(route)) {
      return info;
    }
  }

  return { title: 'Gastometria' };
}
