// src/components/open-finance/connected-accounts-list.tsx

"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  MoreVert as MoreIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as ImportIcon,
} from "@mui/icons-material";
import { usePluggy, PluggyConnection } from "@/hooks/use-pluggy";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConnectedAccountsListProps {
  onImportClick?: (connection: PluggyConnection, accountId: string) => void;
}

export function ConnectedAccountsList({
  onImportClick,
}: ConnectedAccountsListProps) {
  const theme = useTheme();
  const { connections, isLoading, disconnectAccount, fetchConnections } =
    usePluggy();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<PluggyConnection | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    connection: PluggyConnection
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedConnection(connection);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleSync = async () => {
    handleMenuClose();
    await fetchConnections();
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConnection) return;

    setIsDeleting(true);
    await disconnectAccount(selectedConnection.itemId);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setSelectedConnection(null);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "UPDATED":
        return (
          <Chip
            size="small"
            icon={<CheckIcon sx={{ fontSize: 14 }} />}
            label="Sincronizado"
            color="success"
            variant="outlined"
          />
        );
      case "UPDATING":
        return (
          <Chip
            size="small"
            icon={<SyncIcon sx={{ fontSize: 14 }} />}
            label="Atualizando..."
            color="info"
            variant="outlined"
          />
        );
      case "LOGIN_ERROR":
        return (
          <Chip
            size="small"
            icon={<ErrorIcon sx={{ fontSize: 14 }} />}
            label="Erro de login"
            color="error"
            variant="outlined"
          />
        );
      case "OUTDATED":
        return (
          <Chip
            size="small"
            icon={<WarningIcon sx={{ fontSize: 14 }} />}
            label="Desatualizado"
            color="warning"
            variant="outlined"
          />
        );
      default:
        return (
          <Chip
            size="small"
            label={status}
            variant="outlined"
          />
        );
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={120} />
        ))}
      </Stack>
    );
  }

  if (connections.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.5),
          border: `1px dashed ${theme.palette.divider}`,
        }}
      >
        <BankIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Nenhuma conta conectada
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Conecte sua conta bancária para importar transações automaticamente
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        {connections.map((connection) => (
          <Card
            key={connection.itemId}
            sx={{
              borderRadius: 2,
              background: alpha(theme.palette.background.paper, 0.8),
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Avatar
                  src={connection.connectorImageUrl}
                  alt={connection.connectorName}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "background.default",
                  }}
                >
                  <BankIcon />
                </Avatar>

                <Box sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {connection.connectorName}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, connection)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    {getStatusChip(connection.status)}
                    {connection.lastSyncedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Atualizado{" "}
                        {formatDistanceToNow(new Date(connection.lastSyncedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </Typography>
                    )}
                  </Box>

                  {/* Accounts */}
                  {connection.accounts && connection.accounts.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {connection.accounts.map((account) => (
                        <Box
                          key={account.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1.5,
                            borderRadius: 1,
                            background: alpha(theme.palette.primary.main, 0.05),
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {account.name || account.type}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {account.number}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={account.balance >= 0 ? "success.main" : "error.main"}
                            >
                              {formatAmount(account.balance)}
                            </Typography>
                            {onImportClick && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onImportClick(connection, account.id)}
                                title="Importar transações"
                              >
                                <ImportIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleSync}>
          <ListItemIcon>
            <SyncIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Atualizar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Desconectar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Desconectar Conta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja desconectar a conta{" "}
            <strong>{selectedConnection?.connectorName}</strong>? As transações
            já importadas não serão removidas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Desconectando..." : "Desconectar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
