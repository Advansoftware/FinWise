// src/components/ui/credit-badge.tsx
'use client';

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gem, Zap, Brain, Search } from "lucide-react";
import { useCreditTransparency } from "@/hooks/use-credit-transparency";

interface CreditBadgeProps {
  actionKey: string;
  showWhenFree?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
}

export function CreditBadge({ actionKey, showWhenFree = false, variant = 'default' }: CreditBadgeProps) {
  const { getCreditBadgeInfo } = useCreditTransparency();
  const badgeInfo = getCreditBadgeInfo(actionKey);

  if (!badgeInfo.show && !showWhenFree) return null;

  const categoryConfig = {
    simple: { 
      icon: Zap, 
      color: 'bg-green-500/10 text-green-600 border-green-500/20',
      label: 'Simples'
    },
    complex: { 
      icon: Brain, 
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      label: 'Complexa'
    },
    image: { 
      icon: Search, 
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      label: 'Imagem'
    }
  };

  const config = categoryConfig[badgeInfo.category];
  const Icon = config.icon;

  if (!badgeInfo.willCharge) {
    return showWhenFree ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Gem className="h-3 w-3 mr-1" />
              Grátis
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Usando suas próprias credenciais de IA - sem custo de créditos</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : null;
  }

  const content = (
    <Badge variant="outline" className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {variant === 'icon-only' ? null : (
        variant === 'compact' ? `${badgeInfo.cost}c` : `${badgeInfo.cost} créditos`
      )}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{config.label} - {badgeInfo.cost} créditos</p>
            <p className="text-xs text-muted-foreground">
              Usando Gastometria IA - configurar IA própria nas credenciais para uso gratuito
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
