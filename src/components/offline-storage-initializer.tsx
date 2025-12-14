// src/components/offline-storage-initializer.tsx
// Background sync for WebLLM - keeps IndexedDB updated silently
"use client";

import { useEffect, useState, useRef } from "react";
import { offlineStorage } from "@/lib/offline-storage";
import { useAuth } from "@/hooks/use-auth";

/**
 * This component initializes offline storage and syncs data to IndexedDB
 * in the background for WebLLM to use. No UI is shown to the user - 
 * all sync happens silently.
 */
export function OfflineStorageInitializer() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasSyncedRef = useRef(false);

  // Initialize storage
  useEffect(() => {
    const initializeOfflineStorage = async () => {
      try {
        await offlineStorage.init();
        setIsInitialized(true);
        console.log("📦 Offline storage initialized (for WebLLM)");
      } catch (error) {
        console.error("❌ Failed to initialize offline storage:", error);
      }
    };

    initializeOfflineStorage();
  }, []);

  // Sync when user logs in (once per session, silently)
  useEffect(() => {
    if (!isInitialized || !user || hasSyncedRef.current) return;

    const syncData = async () => {
      try {
        console.log("🔄 Background sync for WebLLM...");
        await offlineStorage.forcePullFromServer(user.uid);
        hasSyncedRef.current = true;
        console.log("✅ Background sync complete");
      } catch (error) {
        console.error("Background sync error:", error);
      }
    };

    syncData();
  }, [isInitialized, user]);

  // Sync when online status changes (silently)
  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized || !user) return;

    const handleOnline = async () => {
      try {
        await offlineStorage.syncAll();
      } catch (error) {
        console.error("Background sync error:", error);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isInitialized, user]);

  // No UI - sync happens silently in background
  return null;
}
