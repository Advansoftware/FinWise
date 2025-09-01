"use client"

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine } from 'lucide-react';

export function PWAUpdater() {
  const { toast } = useToast();
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          // A new service worker is installing.
          setNewWorker(reg.installing);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          // New service worker is installed and waiting.
          setWaitingWorker(newWorker);
        }
      });
    }
  }, [newWorker]);

  useEffect(() => {
    if (waitingWorker) {
       toast({
        title: 'Atualização Disponível',
        description: 'Uma nova versão do aplicativo está pronta.',
        duration: Infinity, // Keep the toast open until dismissed
        action: (
          <Button onClick={() => waitingWorker.postMessage({ type: 'SKIP_WAITING' })}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        ),
      });

      // Reload the page once the new service worker has taken control.
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
      });
    }
  }, [waitingWorker, toast]);

  return null; // This component does not render anything
}
