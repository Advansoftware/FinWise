// src/components/offline-storage-initializer.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { offlineStorage } from "@/lib/offline-storage";
import { useAuth } from "@/hooks/use-auth";
import {
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  Typography,
  Stack,
} from "@mui/material";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export function OfflineStorageInitializer() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingOperations: number;
  }>({ isOnline: true, isSyncing: false, pendingOperations: 0 });
  const [showSyncMessage, setShowSyncMessage] = useState(false);

  // Inicializa o storage
  useEffect(() => {
    const initializeOfflineStorage = async () => {
      try {
        await offlineStorage.init();
        setIsInitialized(true);
        console.log("📦 Offline storage inicializado com sucesso");

        // Verifica status inicial
        const status = await offlineStorage.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error("❌ Falha ao inicializar offline storage:", error);
      }
    };

    initializeOfflineStorage();
  }, []);

  // Sincroniza quando usuário loga e quando volta online
  useEffect(() => {
    if (!isInitialized || !user) return;

    const syncData = async () => {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));

      try {
        // Pull inicial do servidor
        await offlineStorage.forcePullFromServer(user.uid);

        const status = await offlineStorage.getSyncStatus();
        setSyncStatus(status);

        if (status.pendingOperations === 0) {
          setShowSyncMessage(true);
        }
      } catch (error) {
        console.error("Erro na sincronização inicial:", error);
      } finally {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
      }
    };

    syncData();
  }, [isInitialized, user]);

  // Monitora status online/offline
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));

      if (user) {
        setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
        await offlineStorage.syncAll();
        const status = await offlineStorage.getSyncStatus();
        setSyncStatus(status);
      }
    };

    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Status inicial
    setSyncStatus((prev) => ({ ...prev, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  // Polling para verificar operações pendentes
  useEffect(() => {
    if (!isInitialized) return;

    const checkPendingOps = async () => {
      const status = await offlineStorage.getSyncStatus();
      setSyncStatus((prev) => ({
        ...prev,
        pendingOperations: status.pendingOperations,
      }));
    };

    const interval = setInterval(checkPendingOps, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [isInitialized]);

  return (
    <>
      {/* Indicador de Status de Sync */}
      {syncStatus.isSyncing && (
        <Box
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            zIndex: 1000,
            bgcolor: "background.paper",
            borderRadius: 2,
            p: 1.5,
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="caption">Sincronizando...</Typography>
        </Box>
      )}

      {/* Indicador de Operações Pendentes */}
      {syncStatus.pendingOperations > 0 && !syncStatus.isSyncing && (
        <Box
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            zIndex: 1000,
            bgcolor: "warning.main",
            color: "warning.contrastText",
            borderRadius: 2,
            p: 1.5,
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <RefreshCw size={16} />
          <Typography variant="caption">
            {syncStatus.pendingOperations} alteração(ões) pendente(s)
          </Typography>
        </Box>
      )}

      {/* Snackbar de Status Offline */}
      <Snackbar
        open={!syncStatus.isOnline}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          icon={<CloudOff size={20} />}
          sx={{ width: "100%" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">
              Você está offline. As alterações serão sincronizadas quando a
              conexão for restaurada.
            </Typography>
          </Stack>
        </Alert>
      </Snackbar>

      {/* Snackbar de Sincronização Completa */}
      <Snackbar
        open={showSyncMessage}
        autoHideDuration={3000}
        onClose={() => setShowSyncMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          icon={<Cloud size={20} />}
          onClose={() => setShowSyncMessage(false)}
        >
          Dados sincronizados com sucesso!
        </Alert>
      </Snackbar>
    </>
  );
}
