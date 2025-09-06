// src/components/ui/cost-warning-dialog.tsx
'use client';

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
import { Badge } from "@/components/ui/badge";
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
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    complex: { 
      icon: Brain, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    image: { 
      icon: Search, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            {title || "Confirmar Uso de Créditos"}
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className={`rounded-lg p-4 border ${config.bgColor} ${config.borderColor}`}>
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{action.name}</h4>
                <Badge variant="secondary">
                  {action.cost} créditos
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Créditos disponíveis:</span>
            <Badge variant={hasEnoughCredits ? "default" : "destructive"}>
              {currentCredits} créditos
            </Badge>
          </div>

          {!hasEnoughCredits && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Info className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Créditos insuficientes. Faça upgrade do seu plano ou configure suas próprias credenciais de IA.
              </p>
            </div>
          )}

          <AlertDialogDescription className="text-xs">
            {getAlternativeMessage()}
          </AlertDialogDescription>
        </div>

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
