// src/components/online-status-indicator.tsx
'use client';

import {useState, useEffect} from 'react';
import {Chip, Typography} from '@mui/material';
import {Wifi, WifiOff} from 'lucide-react';
import {Box, Stack, Typography} from '@mui/material';

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
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1 }}
      >
        {isOnline ? (
          <>
            <Wifi style={{ width: '0.75rem', height: '0.75rem' }} />
            Online
          </>
        ) : (
          <>
            <WifiOff style={{ width: '0.75rem', height: '0.75rem' }} />
            Offline
          </>
        )}
      </Badge>
      
      {!isOnline && (
        <Typography variant="body2" sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
          Dados salvos localmente serão sincronizados quando voltar online
        </Typography>
      )}
    </Box>
  );
}