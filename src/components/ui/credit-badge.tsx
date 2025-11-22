// src/components/ui/credit-badge.tsx
'use client';

import {Box} from '@mui/material';
import { Chip } from "@mui/material";
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
      sx: { 
        bgcolor: 'rgb(34 197 94 / 0.1)', 
        color: 'rgb(22 163 74)', 
        borderColor: 'rgb(34 197 94 / 0.2)' 
      },
      label: 'Simples'
    },
    complex: { 
      icon: Brain, 
      sx: { 
        bgcolor: 'rgb(59 130 246 / 0.1)', 
        color: 'rgb(37 99 235)', 
        borderColor: 'rgb(59 130 246 / 0.2)' 
      },
      label: 'Complexa'
    },
    image: { 
      icon: Search, 
      sx: { 
        bgcolor: 'rgb(168 85 247 / 0.1)', 
        color: 'rgb(147 51 234)', 
        borderColor: 'rgb(168 85 247 / 0.2)' 
      },
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
            <Chip 
              variant="outlined" 
              sx={{ 
                bgcolor: 'rgb(16 185 129 / 0.1)', 
                color: 'rgb(5 150 105)', 
                borderColor: 'rgb(16 185 129 / 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Gem style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
              Grátis
            </Chip>
          </TooltipTrigger>
          <TooltipContent>
            <Box
              component="p"
              sx={{
                fontSize: theme => theme.typography.pxToRem(14),
                color: theme => (theme.palette as any).custom?.mutedForeground,
              }}
            >
              Usando suas próprias credenciais de IA - sem custo de créditos
            </Box>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : null;
  }

  const content = (
    <Chip 
      variant="outlined" 
      sx={{
        ...config.sx,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <Icon style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
      {variant === 'icon-only' ? null : (
        variant === 'compact' ? `${badgeInfo.cost}c` : `${badgeInfo.cost} créditos`
      )}
    </Chip>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box component="p" sx={{ fontWeight: theme => theme.typography.fontWeightMedium }}>
              {config.label} - {badgeInfo.cost} créditos
            </Box>
            <Box 
              component="p" 
              sx={{ 
                fontSize: theme => theme.typography.pxToRem(12), 
                color: theme => (theme.palette as any).custom?.mutedForeground 
              }}
            >
              Usando Gastometria IA - configurar IA própria nas credenciais para uso gratuito
            </Box>
          </Box>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
