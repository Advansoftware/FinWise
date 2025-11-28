"use client"

import {useEffect, useState, useCallback} from 'react';
import {useToast} from '@/hooks/use-toast';
import {Button, Typography, Box, Stack} from '@mui/material';
import {ArrowDownToLine, Wifi, WifiOff} from 'lucide-react';

export function PWAUpdater() {
  const { toast } = useToast();
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Controle de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mostrar toast quando ficar offline/online
  useEffect(() => {
    if (!isOnline) {
      toast({
        title: 'Modo Offline',
        description: 'Você está offline. As alterações serão sincronizadas quando voltar online.',
        duration: 5000,
        variant: 'info',
        action: (
          <WifiOff style={{ width: '1rem', height: '1rem' }} />
        ),
      });
    } else {
      // Verificar se há dados para sincronizar quando voltar online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_DATA'
        });
      }
    }
  }, [isOnline, toast]);

  // Gerenciar instalação PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Mostrar prompt de instalação
  useEffect(() => {
    if (isInstallable && deferredPrompt) {
      toast({
        title: 'Instalar Gastometria',
        description: 'Adicione o Gastometria à sua tela inicial para acesso mais rápido.',
        duration: 10000,
        variant: 'info',
        action: (
          <Button 
            onClick={handleInstallClick} 
            size="small" 
            variant="contained"
            sx={{ 
              minWidth: 'auto',
              px: 2,
              py: 0.5,
              fontSize: '0.875rem'
            }}
          >
            <ArrowDownToLine style={{ marginRight: '0.5rem', width: '0.875rem', height: '0.875rem' }} />
            Instalar
          </Button>
        ),
      });
    }
  }, [isInstallable, deferredPrompt]);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        toast({
          title: 'Instalação Concluída',
          description: 'Gastometria foi adicionado à sua tela inicial!',
          duration: 3000,
          variant: 'success',
        });
      }
    }
  }, [deferredPrompt, toast]);

  // Service Worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[PWA] Service Worker registrado:', reg);
          
          reg.addEventListener('updatefound', () => {
            console.log('[PWA] Nova atualização encontrada');
            setNewWorker(reg.installing);
          });

          // Verificar se já há um worker aguardando
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
          }
        })
        .catch(err => {
          console.log('[PWA] Falha ao registrar Service Worker:', err);
        });

      // REMOVIDO: Verificação automática de atualizações que causava refresh
      // const checkForUpdates = () => {
      //   if ('serviceWorker' in navigator) {
      //     navigator.serviceWorker.getRegistration().then(reg => {
      //       if (reg) {
      //         reg.update();
      //       }
      //     });
      //   }
      // };
      // const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);
      // return () => clearInterval(updateInterval);
    }
  }, []);

  useEffect(() => {
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          console.log('[PWA] Novo Service Worker instalado');
          if (navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
          } else {
            // MODIFICADO: Não fazer reload automático, deixar o usuário decidir
            console.log('[PWA] Primeira instalação, aguardando ação do usuário');
            setWaitingWorker(newWorker);
          }
        }
      });
    }
  }, [newWorker]);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }
  }, [waitingWorker]);

  useEffect(() => {
    if (waitingWorker) {
      toast({
        title: 'Atualização Disponível',
        description: 'Uma nova versão do Gastometria está pronta para usar.',
        duration: Infinity,
        variant: 'info',
        action: (
          <Button 
            onClick={handleUpdate} 
            size="small"
            variant="contained"
            sx={{ 
              minWidth: 'auto',
              px: 2,
              py: 0.5,
              fontSize: '0.875rem'
            }}
          >
            <ArrowDownToLine style={{ marginRight: '0.5rem', width: '0.875rem', height: '0.875rem' }} />
            Atualizar
          </Button>
        ),
      });
    }
  }, [waitingWorker, toast, handleUpdate]);

  // Indicador de status de conexão (opcional)
  if (!isOnline) {
    return (
      <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 50 }}>
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={2} 
          sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)', 
            px: 3, 
            py: 2, 
            borderRadius: 2, 
            fontSize: '0.875rem' 
          }}
        >
          <WifiOff style={{ width: '1rem', height: '1rem' }} />
          <Typography component="span" sx={{ color: 'text.secondary' }}>Offline</Typography>
        </Stack>
      </Box>
    );
  }

  return null;
}
