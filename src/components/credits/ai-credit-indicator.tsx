
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Info, Zap } from 'lucide-react';
import { useCredits } from '@/hooks/use-credits';
import { usePlan } from '@/hooks/use-plan';
import { useAISettings } from '@/hooks/use-ai-settings';
import { Skeleton } from '../ui/skeleton';
import { CreditStatementDialog } from './ai-credit-statement-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';

export function AICreditIndicator() {
  const { credits, isLoading: isLoadingCredits, logs } = useCredits();
  const { plan, isLoading: isLoadingPlan, isPlus, isInfinity } = usePlan();
  const { displayedCredentials, activeCredentialId } = useAISettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isLoading = isLoadingCredits || isLoadingPlan;
  const activeCredential = displayedCredentials.find(c => c.id === activeCredentialId);
  
  // Verifica se está usando Gastometria IA (que consome créditos)
  const isUsingGastometriaAI = activeCredential?.id === 'gastometria-ai-default' || 
                              activeCredential?.provider === 'gastometria' ||
                              !activeCredential;

  // Define a cor do indicador baseado no saldo
  const getCreditColor = (credits: number) => {
    if (credits >= 50) return 'text-green-600';
    if (credits >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Mensagem sobre alternativas gratuitas
  const getAlternativeMessage = () => {
    if (plan === 'Básico') {
      return "Upgrade para Plus (Ollama local) ou Infinity (qualquer IA) para uso ilimitado";
    }
    if (isPlus) {
      return "Configure Ollama local nas credenciais para uso ilimitado e gratuito";
    }
    if (isInfinity) {
      return "Configure suas próprias credenciais de IA para uso ilimitado e gratuito";
    }
    return "";
  };

  if (plan === 'Básico' && !isLoading) {
    return null; // Don't show indicator for basic plan users
  }
  
  return (
    <>
      <CreditStatementDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
       <AnimatePresence>
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
         >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="outline"
                      className="rounded-full shadow-lg backdrop-blur-sm bg-background/70 hover:bg-background h-11 px-3 md:px-4"
                      onClick={() => setIsDialogOpen(true)}
                  >
                      {isLoading ? (
                          <Skeleton className="h-5 w-16" />
                      ) : (
                          <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <span className={`font-bold text-base ${getCreditColor(credits)}`}>{credits}</span>
                              <span className="hidden md:inline text-muted-foreground text-sm ml-1">créditos</span>
                          </div>
                      )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="max-w-xs md:hidden">
                   <p>{credits} créditos restantes</p>
                </TooltipContent>
                 <TooltipContent side="top" align="end" className="hidden md:block max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">Plano {plan} - {credits} créditos disponíveis</p>
                    <p className="text-xs text-muted-foreground">
                      Clique para ver extrato detalhado de uso
                    </p>
                    {isUsingGastometriaAI && (
                      <p className="text-xs text-yellow-600">
                        💡 {getAlternativeMessage()}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Badge indicando status da IA atual */}
            {!isLoading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden md:block">
                        <Badge 
                        variant="outline" 
                        className={isUsingGastometriaAI 
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }
                        >
                        {isUsingGastometriaAI ? (
                            <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Gastometria IA
                            </>
                        ) : (
                            <>
                            <Zap className="h-3 w-3 mr-1" />
                            IA Própria
                            </>
                        )}
                        </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="max-w-xs">
                    {isUsingGastometriaAI ? (
                      <div className="space-y-1">
                        <p className="font-medium">Usando Gastometria IA</p>
                        <p className="text-xs">Ações consomem créditos do seu plano</p>
                        <p className="text-xs text-yellow-600">{getAlternativeMessage()}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium">Usando suas credenciais</p>
                        <p className="text-xs text-emerald-600">Uso ilimitado e gratuito! 🎉</p>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
         </motion.div>
      </AnimatePresence>
    </>
  );
}
