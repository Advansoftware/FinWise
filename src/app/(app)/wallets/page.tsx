// src/app/(app)/wallets/page.tsx
"use client";

import { useState, MouseEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Skeleton,
  Stack,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  Grid,
} from "@mui/material";
import {
  PlusCircle,
  MoreVertical,
  Trash2,
  Edit,
  Banknote,
  CreditCard,
  PiggyBank,
  Landmark,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";
import { CreateWalletDialog } from "@/components/wallets/create-wallet-dialog";
import { GamificationGuide } from "@/components/gamification";
import { Wallet, WalletType } from "@/lib/types";

const WalletIcon = ({ type }: { type: WalletType }) => {
  const iconStyle = { width: "1.5rem", height: "1.5rem" };
  switch (type) {
    case "Conta Corrente":
      return <Landmark style={iconStyle} />;
    case "Cartão de Crédito":
      return <CreditCard style={iconStyle} />;
    case "Poupança":
      return <PiggyBank style={iconStyle} />;
    case "Investimentos":
      return <CircleDollarSign style={iconStyle} />;
    case "Dinheiro":
      return <Banknote style={iconStyle} />;
    default:
      return <CircleDollarSign style={iconStyle} />;
  }
};

export default function WalletsPage() {
  const { wallets, isLoading, deleteWallet } = useWallets();
  const theme = useTheme();

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>(
    undefined
  );

  const handleCreateWallet = () => {
    setSelectedWallet(undefined);
    setCreateDialogOpen(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setSelectedWallet(undefined);
  };

  // Calcular totais
  const totalPositive = wallets
    .filter((w) => (w.balance || 0) > 0)
    .reduce((sum, w) => sum + (w.balance || 0), 0);
  const totalNegative = wallets
    .filter((w) => (w.balance || 0) < 0)
    .reduce((sum, w) => sum + Math.abs(w.balance || 0), 0);
  const netBalance = totalPositive - totalNegative;

  if (isLoading) {
    return <WalletsSkeleton />;
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Carteiras
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie suas fontes de recursos. Carteiras representam suas contas
            bancárias, cartões de crédito ou até mesmo dinheiro físico. Toda
            transação precisa estar associada a uma carteira.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <GamificationGuide />
          <Button
            variant="contained"
            startIcon={<PlusCircle size={18} />}
            onClick={handleCreateWallet}
          >
            Nova Carteira
          </Button>
        </Stack>
      </Stack>

      {/* Cards de Totais - Separados visualmente das carteiras individuais */}
      {wallets.length > 0 && (
        <Stack spacing={2}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
            <Typography variant="h6" fontWeight="semibold">
              Resumo Financeiro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visão geral dos saldos das suas carteiras
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Total Positivo */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(0, 100, 0, 0.1)"
                      : "rgba(0, 200, 0, 0.05)",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(0, 200, 0, 0.3)"
                      : "rgba(0, 200, 0, 0.2)",
                  borderWidth: 1,
                }}
              >
                <CardHeader
                  title={
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(144, 238, 144, 1)"
                            : "rgba(0, 100, 0, 1)",
                      }}
                    >
                      Total Positivo
                    </Typography>
                  }
                  action={
                    <TrendingUp
                      size={18}
                      style={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(144, 238, 144, 0.8)"
                            : "rgba(0, 150, 0, 1)",
                      }}
                    />
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                      color:
                        theme.palette.mode === "dark"
                          ? "rgba(144, 238, 144, 1)"
                          : "rgba(0, 120, 0, 1)",
                    }}
                  >
                    R$ {totalPositive.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        theme.palette.mode === "dark"
                          ? "rgba(144, 238, 144, 0.7)"
                          : "rgba(0, 150, 0, 0.8)",
                    }}
                  >
                    Saldo acumulado das carteiras com valores positivos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Negativo */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(139, 0, 0, 0.1)"
                      : "rgba(255, 0, 0, 0.05)",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 99, 71, 0.3)"
                      : "rgba(255, 0, 0, 0.2)",
                  borderWidth: 1,
                }}
              >
                <CardHeader
                  title={
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 182, 193, 1)"
                            : "rgba(139, 0, 0, 1)",
                      }}
                    >
                      Total Negativo
                    </Typography>
                  }
                  action={
                    <TrendingDown
                      size={18}
                      style={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 182, 193, 0.8)"
                            : "rgba(220, 20, 60, 1)",
                      }}
                    />
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                      color:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 182, 193, 1)"
                          : "rgba(178, 34, 34, 1)",
                    }}
                  >
                    R$ {totalNegative.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 182, 193, 0.7)"
                          : "rgba(220, 20, 60, 0.8)",
                    }}
                  >
                    Soma das dívidas (valores negativos)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Saldo Líquido */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  bgcolor:
                    netBalance >= 0
                      ? theme.palette.mode === "dark"
                        ? "rgba(0, 0, 139, 0.1)"
                        : "rgba(0, 0, 255, 0.05)"
                      : theme.palette.mode === "dark"
                      ? "rgba(255, 140, 0, 0.1)"
                      : "rgba(255, 165, 0, 0.05)",
                  borderColor:
                    netBalance >= 0
                      ? theme.palette.mode === "dark"
                        ? "rgba(100, 149, 237, 0.3)"
                        : "rgba(0, 0, 255, 0.2)"
                      : theme.palette.mode === "dark"
                      ? "rgba(255, 165, 0, 0.3)"
                      : "rgba(255, 140, 0, 0.2)",
                  borderWidth: 2,
                }}
              >
                <CardHeader
                  title={
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color:
                          netBalance >= 0
                            ? theme.palette.mode === "dark"
                              ? "rgba(173, 216, 230, 1)"
                              : "rgba(0, 0, 139, 1)"
                            : theme.palette.mode === "dark"
                            ? "rgba(255, 218, 185, 1)"
                            : "rgba(255, 140, 0, 1)",
                      }}
                    >
                      Saldo Líquido
                    </Typography>
                  }
                  action={
                    <DollarSign
                      size={18}
                      style={{
                        color:
                          netBalance >= 0
                            ? theme.palette.mode === "dark"
                              ? "rgba(173, 216, 230, 0.8)"
                              : "rgba(0, 0, 205, 1)"
                            : theme.palette.mode === "dark"
                            ? "rgba(255, 218, 185, 0.8)"
                            : "rgba(255, 140, 0, 1)",
                      }}
                    />
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                      color:
                        netBalance >= 0
                          ? theme.palette.mode === "dark"
                            ? "rgba(173, 216, 230, 1)"
                            : "rgba(0, 0, 205, 1)"
                          : theme.palette.mode === "dark"
                          ? "rgba(255, 218, 185, 1)"
                          : "rgba(255, 140, 0, 1)",
                    }}
                  >
                    R$ {netBalance.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        netBalance >= 0
                          ? theme.palette.mode === "dark"
                            ? "rgba(173, 216, 230, 0.7)"
                            : "rgba(0, 0, 205, 0.8)"
                          : theme.palette.mode === "dark"
                          ? "rgba(255, 218, 185, 0.7)"
                          : "rgba(255, 140, 0, 0.8)",
                    }}
                  >
                    {netBalance >= 0
                      ? "Patrimônio líquido positivo"
                      : "Patrimônio líquido negativo"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}

      {/* Separador visual entre totais e carteiras individuais */}
      {wallets.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
          <Typography variant="h6" fontWeight="semibold">
            Carteiras Individuais
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie cada uma das suas carteiras
          </Typography>
        </Box>
      )}

      {wallets.length > 0 ? (
        <Grid container spacing={3}>
          {wallets.map((wallet) => (
            <Grid key={wallet.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <WalletCard
                wallet={wallet}
                onDelete={() => deleteWallet(wallet.id)}
                onEdit={() => handleEditWallet(wallet)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Stack alignItems="center" spacing={2}>
              <Landmark size={48} style={{ opacity: 0.5 }} />
              <Typography variant="h6">Nenhuma carteira encontrada.</Typography>
              <Typography variant="body2" color="text.secondary" maxWidth="sm">
                Para começar, você precisa criar sua primeira carteira. Pense
                nela como sua conta bancária principal ou o cartão que mais usa.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlusCircle size={16} />}
                onClick={handleCreateWallet}
              >
                Criar Primeira Carteira
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <CreateWalletDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
        initialData={selectedWallet}
      />
    </Stack>
  );
}

interface WalletCardProps {
  wallet: Wallet;
  onDelete: () => void;
  onEdit: () => void;
}

function WalletCard({ wallet, onDelete, onEdit }: WalletCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          action={
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertical size={18} />
            </IconButton>
          }
          title={
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                p={1}
                borderRadius="50%"
                bgcolor="primary.light"
                color="primary.main"
                display="flex"
              >
                <WalletIcon type={wallet.type} />
              </Box>
              <Box>
                <Typography variant="h6" noWrap title={wallet.name}>
                  {wallet.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {wallet.type}
                </Typography>
              </Box>
            </Box>
          }
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Saldo Atual
          </Typography>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              color: (wallet.balance || 0) < 0 ? "error.main" : "text.primary",
            }}
          >
            R$ {(wallet.balance || 0).toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            onEdit();
            handleMenuClose();
          }}
        >
          <Edit size={16} style={{ marginRight: 8 }} /> Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <Trash2 size={16} style={{ marginRight: 8 }} /> Excluir Carteira
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Você tem certeza?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a
            carteira "{wallet.name}". Você só pode excluir carteiras que não
            possuem transações.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function WalletsSkeleton() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={400} height={24} />
        </Box>
        <Skeleton
          variant="rectangular"
          width={150}
          height={36}
          sx={{ borderRadius: 1 }}
        />
      </Stack>

      {/* Skeleton para cards de totais */}
      <Stack spacing={2}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
          <Skeleton variant="text" width={160} height={28} />
          <Skeleton variant="text" width={250} height={20} />
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton
              variant="rectangular"
              height={128}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton
              variant="rectangular"
              height={128}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton
              variant="rectangular"
              height={128}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Stack>

      {/* Skeleton para carteiras individuais */}
      <Stack spacing={2}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}>
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="text" width={220} height={20} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
              <Skeleton
                variant="rectangular"
                height={176}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
}
