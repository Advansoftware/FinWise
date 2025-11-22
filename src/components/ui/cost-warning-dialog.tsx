// src/components/ui/cost-warning-dialog.tsx
'use client';

import {Box} from '@mui/material';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Chip } from "@mui/material";
import { Gem, Zap, Brain, Search, Info } from "lucide-react";
import { useCreditTransparency } from "@/hooks/use-credit-transparency";

interface CostWarningDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actionKey: string;
  onConfirm: () => void;
  title?: string;
}

export function CostWarningDialog({ 
  isOpen, 
  onOpenChange, 
  actionKey, 
  onConfirm,
  title 
}: CostWarningDialogProps) {
  const { actions, currentCredits, getAlternativeMessage, willConsumeCredits } = useCreditTransparency();
  
  const action = actions[actionKey];
  if (!action || !willConsumeCredits) return null;

  const categoryConfig = {
    simple: { 
      icon: Zap, 
      color: 'rgb(22 163 74)',
      bgColor: 'rgb(240 253 244)',
      darkBgColor: 'rgb(20 83 45 / 0.2)',
      borderColor: 'rgb(187 247 208)',
      darkBorderColor: 'rgb(22 101 52)'
    },
    complex: { 
      icon: Brain, 
      color: 'rgb(37 99 235)',
      bgColor: 'rgb(239 246 255)',
      darkBgColor: 'rgb(30 58 138 / 0.2)',
      borderColor: 'rgb(191 219 254)',
      darkBorderColor: 'rgb(30 64 175)'
    },
    image: { 
      icon: Search, 
      color: 'rgb(147 51 234)',
      bgColor: 'rgb(250 245 255)',
      darkBgColor: 'rgb(88 28 135 / 0.2)',
      borderColor: 'rgb(233 213 255)',
      darkBorderColor: 'rgb(107 33 168)'
    }
  };

  const config = categoryConfig[action.category];
  const Icon = config.icon;
  const hasEnoughCredits = currentCredits >= action.cost;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent sx={{ maxWidth: '28rem' }}>
        <AlertDialogHeader>
          <AlertDialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Gem style={{ width: '1.25rem', height: '1.25rem', color: 'var(--mui-palette-primary-main)' }} />
            {title || "Confirmar Uso de Créditos"}
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <Box 
          sx={{
            borderRadius: theme => typeof theme.shape.borderRadius === 'number' ? `${theme.shape.borderRadius}px` : '8px',
            padding: theme => theme.spacing(4),
            border: theme => `1px solid ${theme.palette.mode === 'dark' ? config.darkBorderColor : config.borderColor}`,
            bgcolor: theme => theme.palette.mode === 'dark' ? config.darkBgColor : config.bgColor,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <Icon style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.125rem', color: config.color }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box component="h4" sx={{ fontWeight: theme => theme.typography.fontWeightMedium }}>
                  {action.name}
                </Box>
                <Badge variant="contained" color="secondary">
                  {action.cost} créditos
                </Badge>
              </Box>
              <Box 
                component="p" 
                sx={{ 
                  fontSize: theme => theme.typography.pxToRem(14), 
                  color: theme => (theme.palette as any).custom?.mutedForeground 
                }}
              >
                {action.description}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: theme => theme.typography.pxToRem(14) }}>
            <span>Créditos disponíveis:</span>
            <Badge variant={hasEnoughCredits ? "default" : "destructive"}>
              {currentCredits} créditos
            </Badge>
          </Box>

          {!hasEnoughCredits && (
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                padding: theme => theme.spacing(3),
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgb(69 26 3 / 0.2)' : 'rgb(254 252 232)',
                border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgb(133 77 14)' : 'rgb(254 240 138)'}`,
                borderRadius: theme => typeof theme.shape.borderRadius === 'number' ? `${theme.shape.borderRadius}px` : '8px',
              }}
            >
              <Info style={{ width: '1rem', height: '1rem', color: 'rgb(217 119 6)', marginTop: '0.125rem' }} />
              <Box 
                component="p" 
                sx={{ 
                  fontSize: theme => theme.typography.pxToRem(14),
                  color: theme => theme.palette.mode === 'dark' ? 'rgb(253 224 71)' : 'rgb(161 98 7)'
                }}
              >
                Créditos insuficientes. Faça upgrade do seu plano ou configure suas próprias credenciais de IA.
              </Box>
            </Box>
          )}

          <AlertDialogDescription sx={{ fontSize: theme => theme.typography.pxToRem(12) }}>
            {getAlternativeMessage()}
          </AlertDialogDescription>
        </Box>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!hasEnoughCredits}
          >
            {hasEnoughCredits ? `Usar ${action.cost} créditos` : 'Créditos insuficientes'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
