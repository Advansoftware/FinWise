
// src/app/(docs)/docs/_components/docs-sidebar-nav.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DocsSidebarNavProps {
    items: {
        title: string;
        slug: string;
    }[];
}

export function DocSidebarNav({ items }: DocsSidebarNavProps) {
    const pathname = usePathname();

    return items.length ? (
        <nav className="w-full">
            <h3 className="font-semibold mb-2 px-2">Documentação</h3>
            {items.map((item) => (
                <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    className={cn(
                        'flex w-full items-center rounded-md p-2 hover:bg-muted/50 capitalize',
                        {
                            'bg-muted/80 font-semibold text-primary': pathname === `/docs/${item.slug}`,
                        }
                    )}
                >
                    {item.title}
                </Link>
            ))}
        </nav>
    ) : null;
}
