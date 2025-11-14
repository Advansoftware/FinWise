
'use client';

import { usePlan } from "@/hooks/use-plan";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Gem } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Box, Stack } from '@mui/material';

interface ProUpgradeButtonProps {
    children: React.ReactNode;
    requiredPlan: 'Pro' | 'Plus';
    tooltipContent?: string;
    className?: string;
}

export function ProUpgradeButton({ children, requiredPlan, tooltipContent, className }: ProUpgradeButtonProps) {
    const { plan, isLoading } = usePlan();
    
    const planHierarchy = { 'Básico': 0, 'Pro': 1, 'Plus': 2, 'Infinity': 3 };

    const hasAccess = !isLoading && planHierarchy[plan] >= planHierarchy[requiredPlan];

    if (hasAccess) {
        return <>{children}</>;
    }

    const defaultTooltip = `Este é um recurso do plano ${requiredPlan}. Clique para fazer upgrade.`;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Box sx={{ position: 'relative', width: '100%' }}>
                    {children}
                    <Box sx={{ 
                        position: 'absolute', 
                        inset: 0, 
                        bgcolor: 'rgba(var(--background-rgb), 0.6)', 
                        backdropFilter: 'blur(4px)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: 1, 
                        cursor: 'pointer',
                        '&:hover .gem-icon': { opacity: 1, transform: 'scale(1.1)' }
                    }}>
                        <Link href="/billing" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <Gem className="gem-icon" style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)', opacity: 0.8, transition: 'all 0.2s' }} />
                        </Link>
                    </Box>
                </Box>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipContent || defaultTooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}
