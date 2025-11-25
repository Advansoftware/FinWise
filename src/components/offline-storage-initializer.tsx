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
      {/* Indicador de Status de Sync - Sutil */}
      {syncStatus.isSyncing && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 900,
            bgcolor: "rgba(0,0,0,0.6)",
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            backdropFilter: "blur(4px)",
          }}
        >
          <CircularProgress size={12} sx={{ color: "grey.400" }} />
          <Typography
            variant="caption"
            sx={{ fontSize: "0.7rem", color: "grey.400" }}
          >
            Sync
          </Typography>
        </Box>
      )}

      {/* Indicador de Operações Pendentes - Sutil */}
      {syncStatus.pendingOperations > 0 && !syncStatus.isSyncing && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 900,
            bgcolor: "rgba(245, 158, 11, 0.2)",
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <RefreshCw size={12} style={{ color: "#f59e0b" }} />
          <Typography
            variant="caption"
            sx={{ fontSize: "0.7rem", color: "#f59e0b" }}
          >
            {syncStatus.pendingOperations} pendente
            {syncStatus.pendingOperations > 1 ? "s" : ""}
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

      {/* Indicador de Sincronização Completa - Muito Sutil */}
      <Snackbar
        open={showSyncMessage}
        autoHideDuration={1500}
        onClose={() => setShowSyncMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        sx={{ bottom: { xs: 8, sm: 16 }, left: { xs: 8, sm: 16 } }}
      >
        <Box
          sx={{
            bgcolor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 1,
            px: 1.5,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            backdropFilter: "blur(4px)",
          }}
        >
          <Cloud size={12} style={{ color: "#10b981" }} />
          <Typography
            variant="caption"
            sx={{ fontSize: "0.7rem", color: "#10b981" }}
          >
            Sincronizado
          </Typography>
        </Box>
      </Snackbar>
    </>
  );
}
