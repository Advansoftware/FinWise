// src/components/offline-storage-initializer.tsx
'use client';

import { useEffect } from 'react';
import { offlineStorage } from '@/lib/offline-storage';

export function OfflineStorageInitializer() {
  useEffect(() => {
    const initializeOfflineStorage = async () => {
      try {
        await offlineStorage.init();
        console.log('📦 Offline storage initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize offline storage:', error);
      }
    };

    initializeOfflineStorage();
  }, []);

  // This component doesn't render anything
  return null;
}