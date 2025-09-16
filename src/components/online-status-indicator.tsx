// src/components/online-status-indicator.tsx
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const onlineStatus = navigator.onLine;
      setIsOnline(onlineStatus);
      
      // Show offline message briefly when going offline
      if (!onlineStatus) {
        setShowOfflineMessage(true);
        setTimeout(() => setShowOfflineMessage(false), 3000);
      }
    };

    // Set initial status
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (isOnline && !showOfflineMessage) {
    return null; // Don't show indicator when online
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-2 px-3 py-1"
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>
      
      {!isOnline && (
        <div className="mt-2 text-sm text-muted-foreground">
          Dados salvos localmente serão sincronizados quando voltar online
        </div>
      )}
    </div>
  );
}