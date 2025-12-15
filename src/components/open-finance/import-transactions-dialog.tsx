// src/components/open-finance/import-transactions-dialog.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Chip,
  Divider,
  TextField,
  MenuItem,
  useTheme,
  alpha,
  Alert,
} from "@mui/material";
import {
  Download as ImportIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { usePluggy, PluggyConnection } from "@/hooks/use-pluggy";
import { PluggyTransaction } from "@/services/pluggy";
import { useWallets } from "@/hooks/use-wallets";
import { format, subMonths } from "date-fns";

interface ImportTransactionsDialogProps {
  open: boolean;
  onClose: () => void;
  connection: PluggyConnection | null;
  accountId: string | null;
  onSuccess?: () => void;
}

export function ImportTransactionsDialog({
  open,
  onClose,
  connection,
  accountId,
  onSuccess,
}: ImportTransactionsDialogProps) {
  const theme = useTheme();
  const { fetchTransactions, importTransactions } = usePluggy();
  const { wallets } = useWallets();

  const [transactions, setTransactions] = useState<PluggyTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(
    format(subMonths(new Date(), 1), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  // Set default wallet
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets, selectedWalletId]);

  // Fetch transactions when dialog opens
  useEffect(() => {
    if (open && accountId) {
      loadTransactions();
    }
  }, [open, accountId, dateFrom, dateTo]);

  const loadTransactions = async () => {
    if (!accountId) return;

    setIsLoading(true);
    setImportResult(null);

    const data = await fetchTransactions(accountId, {
      from: dateFrom,
      to: dateTo,
    });

    if (data) {
      setTransactions(data.results);
      // Select all by default
      setSelectedIds(new Set(data.results.map((tx) => tx.id)));
    }

    setIsLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((tx) => tx.id)));
    }
  };

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleImport = async () => {
    if (!accountId || !selectedWalletId || selectedIds.size === 0) return;

    setIsImporting(true);

    const result = await importTransactions({
      accountId,
      walletId: selectedWalletId,
      from: dateFrom,
      to: dateTo,
      transactionIds: Array.from(selectedIds),
    });

    setIsImporting(false);

    if (result) {
      setImportResult(result);
      if (result.imported > 0) {
        onSuccess?.();
      }
    }
  };

  const handleClose = () => {
    setTransactions([]);
    setSelectedIds(new Set());
    setImportResult(null);
    onClose();
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(amount));
    return type === "CREDIT" ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ImportIcon />
          <Typography variant="h6">Importar Transações</Typography>
          {connection && (
            <Chip
              size="small"
              label={connection.connectorName}
              variant="outlined"
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField
            type="date"
            label="Data Inicial"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="Data Final"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Carteira de Destino"
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            {wallets.map((wallet) => (
              <MenuItem key={wallet.id} value={wallet.id}>
                {wallet.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={loadTransactions} disabled={isLoading}>
            Buscar
          </Button>
        </Stack>

        {/* Import Result */}
        {importResult && (
          <Alert
            severity="success"
            icon={<CheckIcon />}
            sx={{ mb: 2 }}
            onClose={() => setImportResult(null)}
          >
            {importResult.imported} transações importadas
            {importResult.skipped > 0 &&
              ` (${importResult.skipped} já existentes)`}
          </Alert>
        )}

        {/* Transactions List */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              Nenhuma transação encontrada no período selecionado
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedIds.size === transactions.length}
                    indeterminate={
                      selectedIds.size > 0 &&
                      selectedIds.size < transactions.length
                    }
                    onChange={handleSelectAll}
                  />
                }
                label={`Selecionar todas (${transactions.length})`}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedIds.size} selecionadas
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              <Stack spacing={1}>
                {transactions.map((tx) => (
                  <Box
                    key={tx.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 1,
                      background: selectedIds.has(tx.id)
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.background.paper, 0.5),
                      cursor: "pointer",
                      "&:hover": {
                        background: alpha(theme.palette.primary.main, 0.15),
                      },
                    }}
                    onClick={() => handleToggle(tx.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(tx.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggle(tx.id)}
                    />
                    <Box sx={{ flexGrow: 1, ml: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {tx.description}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(tx.date), "dd/MM/yyyy")}
                        </Typography>
                        {tx.category && (
                          <Chip
                            size="small"
                            label={tx.category}
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                        )}
                        {tx.merchant?.name && (
                          <Typography variant="caption" color="text.secondary">
                            • {tx.merchant.name}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={tx.type === "CREDIT" ? "success.main" : "error.main"}
                    >
                      {formatAmount(tx.amount, tx.type)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={
            isImporting ||
            selectedIds.size === 0 ||
            !selectedWalletId ||
            isLoading
          }
          startIcon={
            isImporting ? <CircularProgress size={20} /> : <ImportIcon />
          }
        >
          {isImporting
            ? "Importando..."
            : `Importar ${selectedIds.size} transações`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
