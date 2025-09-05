
'use client';

import { usePlan } from "@/hooks/use-plan";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, Gem } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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
                <div className={cn("relative w-full", className)}>
                    {children}
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-md cursor-pointer group">
                        <Link href="/billing" className="w-full h-full flex items-center justify-center">
                           <Gem className="h-5 w-5 text-primary opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"/>
                        </Link>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipContent || defaultTooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}
