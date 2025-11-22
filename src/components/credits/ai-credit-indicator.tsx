
'use client';

import {useState} from 'react';
import {Button} from '@mui/material';
import {Sparkles, Info, Zap} from 'lucide-react';
import {useCredits} from '@/hooks/use-credits';
import {usePlan} from '@/hooks/use-plan';
import {useAISettings} from '@/hooks/use-ai-settings';
import {Skeleton} from '../ui/skeleton';
import {CreditStatementDialog} from './ai-credit-statement-dialog';
import {AnimatePresence, motion} from 'framer-motion';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../ui/tooltip';
import {Chip} from '@mui/material';
import {Box, Stack} from '@mui/material';

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
    if (credits >= 50) return '#16a34a';
    if (credits >= 20) return '#ca8a04';
    return '#dc2626';
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
         <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
         >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="outlined"
                      onClick={() => setIsDialogOpen(true)}
                      sx={{
                        borderRadius: '9999px',
                        boxShadow: 3,
                        backdropFilter: 'blur(4px)',
                        bgcolor: theme => `${theme.palette.background.default}b3`,
                        '&:hover': {
                          bgcolor: 'background.default'
                        },
                        height: '2.75rem',
                        px: { xs: 3, md: 4 }
                      }}
                  >
                      {isLoading ? (
                          <Skeleton sx={{ height: '1.25rem', width: '4rem' }} />
                      ) : (
                          <Stack direction="row" spacing={2} alignItems="center">
                              <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                              <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1rem', color: getCreditColor(credits) }}>{credits}</Box>
                              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, color: 'text.secondary', fontSize: '0.875rem', ml: 1 }}>créditos</Box>
                          </Stack>
                      )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" sx={{ maxWidth: '20rem', display: { xs: 'block', md: 'none' } }}>
                   <p>{credits} créditos restantes</p>
                </TooltipContent>
                 <TooltipContent side="top" align="end" sx={{ display: { xs: 'none', md: 'block' }, maxWidth: '20rem' }}>
                  <Stack spacing={2}>
                    <Box component="p" sx={{ fontWeight: 500 }}>Plano {plan} - {credits} créditos disponíveis</Box>
                    <Box component="p" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      Clique para ver extrato detalhado de uso
                    </Box>
                    {isUsingGastometriaAI && (
                      <Box component="p" sx={{ fontSize: '0.75rem', color: '#ca8a04' }}>
                        💡 {getAlternativeMessage()}
                      </Box>
                    )}
                  </Stack>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Badge indicando status da IA atual */}
            {!isLoading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Badge 
                        variant="outlined" 
                        sx={isUsingGastometriaAI 
                            ? { bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.2)' }
                            : { bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.2)' }
                        }
                        >
                        {isUsingGastometriaAI ? (
                            <>
                            <Sparkles style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                            Gastometria IA
                            </>
                        ) : (
                            <>
                            <Zap style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                            IA Própria
                            </>
                        )}
                        </Badge>
                    </Box>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" sx={{ maxWidth: '20rem' }}>
                    {isUsingGastometriaAI ? (
                      <Stack spacing={1}>
                        <Box component="p" sx={{ fontWeight: 500 }}>Usando Gastometria IA</Box>
                        <Box component="p" sx={{ fontSize: '0.75rem' }}>Ações consomem créditos do seu plano</Box>
                        <Box component="p" sx={{ fontSize: '0.75rem', color: '#ca8a04' }}>{getAlternativeMessage()}</Box>
                      </Stack>
                    ) : (
                      <Stack spacing={1}>
                        <Box component="p" sx={{ fontWeight: 500 }}>Usando suas credenciais</Box>
                        <Box component="p" sx={{ fontSize: '0.75rem', color: '#059669' }}>Uso ilimitado e gratuito! 🎉</Box>
                      </Stack>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
         </Box>
      </AnimatePresence>
    </>
  );
}
