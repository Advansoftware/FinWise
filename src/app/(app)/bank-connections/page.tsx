// src/app/bank-connections/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  alpha,
  Stack,
  Chip,
  Alert,
  AlertTitle,
  Skeleton,
} from "@mui/material";
import { Landmark, Shield, RefreshCw } from "lucide-react";

// Lazy load components that use hooks requiring context
import dynamic from "next/dynamic";

const PluggyConnectCard = dynamic(
  () =>
    import("@/components/open-finance/pluggy-connect-button").then(
      (mod) => mod.PluggyConnectCard
    ),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={200} /> }
);

const ConnectedAccountsList = dynamic(
  () =>
    import("@/components/open-finance/connected-accounts-list").then(
      (mod) => mod.ConnectedAccountsList
    ),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={150} /> }
);

const ImportTransactionsDialog = dynamic(
  () =>
    import("@/components/open-finance/import-transactions-dialog").then(
      (mod) => mod.ImportTransactionsDialog
    ),
  { ssr: false }
);

const OpenFinanceSetup = dynamic(
  () =>
    import("@/components/open-finance/open-finance-setup").then(
      (mod) => mod.OpenFinanceSetup
    ),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={150} /> }
);

export default function BankConnectionsPage() {
  const [mounted, setMounted] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImport = (connection: any, accountId: string) => {
    setSelectedConnection(connection);
    setSelectedAccountId(accountId);
    setImportDialogOpen(true);
  };

  const handleCloseImport = () => {
    setImportDialogOpen(false);
    setSelectedConnection(null);
    setSelectedAccountId(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Landmark size={24} color="var(--mui-palette-success-main)" />
          </Box>
          <Typography variant="h5" fontWeight={600}>
            Open Finance
          </Typography>
          <Chip
            size="small"
            icon={<Shield size={12} />}
            label="Seguro"
            color="success"
            variant="outlined"
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Conecte suas contas bancárias para importar transações automaticamente
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert
        severity="info"
        sx={{ mb: 3, borderRadius: 2 }}
        icon={<RefreshCw size={20} />}
      >
        <AlertTitle>Sincronização Automática</AlertTitle>
        Ao conectar sua conta, importamos automaticamente os últimos 30 dias de
        transações. Novas transações são sincronizadas automaticamente via
        webhook.
      </Alert>

      <Stack spacing={3}>
        {/* Connect Card */}
        <PluggyConnectCard onSuccess={() => {}} />

        {/* Open Finance Setup - Smart Transfers */}
        {mounted && <OpenFinanceSetup />}

        {/* Connected Accounts */}
        {mounted && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
              border: 1,
              borderColor: (theme) => alpha(theme.palette.divider, 0.1),
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Contas Conectadas
            </Typography>
            <ConnectedAccountsList onImportClick={handleImport} />
          </Paper>
        )}
      </Stack>

      {/* Import Dialog */}
      {mounted && (
        <ImportTransactionsDialog
          open={importDialogOpen}
          onClose={handleCloseImport}
          connection={selectedConnection}
          accountId={selectedAccountId}
          onSuccess={() => {}}
        />
      )}
    </Box>
  );
}
