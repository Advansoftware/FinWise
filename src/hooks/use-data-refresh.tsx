'use client';

import {createContext, useContext, useCallback, ReactNode, useRef, useEffect} from 'react';
import {usePathname} from 'next/navigation';

interface DataRefreshContextType {
  triggerRefresh: (type?: 'transactions' | 'wallets' | 'budgets' | 'goals' | 'all') => void;
  registerRefreshHandler: (key: string, handler: () => Promise<void> | void) => void;
  unregisterRefreshHandler: (key: string) => void;
  refreshOnNavigation: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined);

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string>();
  
  // Use useRef to store handlers to avoid recreating them on every render
  const refreshHandlersRef = useRef<Map<string, () => Promise<void> | void>>(new Map());

  const registerRefreshHandler = useCallback((key: string, handler: () => Promise<void> | void) => {
    refreshHandlersRef.current.set(key, handler);
  }, []);

  const unregisterRefreshHandler = useCallback((key: string) => {
    refreshHandlersRef.current.delete(key);
  }, []);

  const triggerRefresh = useCallback(async (type: 'transactions' | 'wallets' | 'budgets' | 'goals' | 'all' = 'all') => {
    const promises: Promise<any>[] = [];
    
    if (type === 'all') {
      // Refresh all registered handlers
      for (const [key, handler] of refreshHandlersRef.current.entries()) {
        const result = handler();
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    } else {
      // Refresh specific handlers based on type
      const relevantHandlers = Array.from(refreshHandlersRef.current.entries()).filter(([key]) => {
        return key.includes(type) || key === 'all';
      });
      
      for (const [, handler] of relevantHandlers) {
        const result = handler();
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        console.log(`🔄 Data refreshed for: ${type}`);
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
  }, []);

  const refreshOnNavigation = useCallback(async () => {
    // Always refresh data when navigating to ensure fresh information
    await triggerRefresh('all');
  }, [triggerRefresh]);

  // Auto-refresh when pathname changes (navigation)
  useEffect(() => {
    // Only trigger refresh if this is not the initial load
    if (previousPathnameRef.current && previousPathnameRef.current !== pathname) {
      console.log(`🚀 Navigation detected: ${previousPathnameRef.current} → ${pathname}`);
      refreshOnNavigation();
    }
    
    previousPathnameRef.current = pathname;
  }, [pathname, refreshOnNavigation]);

  const value: DataRefreshContextType = {
    triggerRefresh,
    registerRefreshHandler,
    unregisterRefreshHandler,
    refreshOnNavigation,
  };

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext);
  if (context === undefined) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
}