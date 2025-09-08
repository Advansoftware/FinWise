"use client"

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, Wifi, WifiOff } from 'lucide-react';

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
        action: (
          <WifiOff className="h-4 w-4 text-muted-foreground" />
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
        action: (
          <Button onClick={handleInstallClick} size="sm" className="h-8 px-3 py-1">
            <ArrowDownToLine className="mr-2 h-3 w-3" />
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
        action: (
          <Button onClick={handleUpdate} size="sm" className="h-8 px-3 py-1">
            <ArrowDownToLine className="mr-2 h-3 w-3" />
            Atualizar
          </Button>
        ),
      });
    }
  }, [waitingWorker, toast, handleUpdate]);

  // Indicador de status de conexão (opcional)
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-3 py-2 rounded-lg text-sm">
          <WifiOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Offline</span>
        </div>
      </div>
    );
  }

  return null;
}
