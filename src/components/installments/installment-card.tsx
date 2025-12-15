// src/components/installments/installment-card.tsx

import { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Grid,
  useTheme,
  alpha,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  CreditCard,
  Calendar,
  DollarSign,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit3,
  Trash2,
} from "lucide-react";
import { Installment } from "@/core/ports/installments.port";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useInstallments } from "@/hooks/use-installments";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { PayInstallmentDialog } from "./pay-installment-dialog";
import { EditInstallmentDialog } from "./edit-installment-dialog";
import { MarkAsPaidDialog } from "./mark-as-paid-dialog";
import { PaymentButton } from "@/components/bank-payment";

interface InstallmentCardProps {
  installment: Installment;
  showActions?: boolean;
}

export function InstallmentCard({
  installment,
  showActions = true,
}: InstallmentCardProps) {
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMarkAsPaidOpen, setIsMarkAsPaidOpen] = useState(false);
  const { deleteInstallment } = useInstallments();
  const { contacts } = useBankPayment();
  const [editingInstallment, setEditingInstallment] =
    useState<Installment | null>(null);
  const theme = useTheme();

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Get linked contact and PIX key data
  const linkedContact = useMemo(() => {
    if (!installment.contactId) return null;
    return contacts.find((c) => c.id === installment.contactId) || null;
  }, [installment.contactId, contacts]);

  const linkedPixKey = useMemo(() => {
    if (!linkedContact || !installment.pixKeyId) return null;
    // Support both new pixKeys array and legacy single key
    if (linkedContact.pixKeys && linkedContact.pixKeys.length > 0) {
      return (
        linkedContact.pixKeys.find((k) => k.id === installment.pixKeyId) ||
        linkedContact.pixKeys.find((k) => k.isDefault) ||
        linkedContact.pixKeys[0]
      );
    }
    if (linkedContact.pixKey && linkedContact.pixKeyType) {
      return {
        id: "legacy",
        pixKeyType: linkedContact.pixKeyType,
        pixKey: linkedContact.pixKey,
        bank: linkedContact.bank,
        bankName: linkedContact.bankName,
        isDefault: true,
        createdAt: linkedContact.createdAt,
      };
    }
    return null;
  }, [linkedContact, installment.pixKeyId]);

  const progressPercentage =
    (installment.paidInstallments / installment.totalInstallments) * 100;

  const nextPayment = installment.payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];

  const overdueCount = installment.payments.filter(
    (p) => p.status === "overdue"
  ).length;

  const getStatusBadge = () => {
    if (installment.isCompleted) {
      return (
        <Chip
          label="Concluído"
          size="small"
          icon={
            <CheckCircle2 style={{ width: "0.75rem", height: "0.75rem" }} />
          }
          sx={{
            bgcolor: "success.lighter",
            color: "success.main",
            fontWeight: "bold",
            "& .MuiChip-icon": { color: "success.main" },
          }}
        />
      );
    }

    if (overdueCount > 0) {
      return (
        <Chip
          label={`${overdueCount} Em Atraso`}
          size="small"
          icon={
            <AlertTriangle style={{ width: "0.75rem", height: "0.75rem" }} />
          }
          sx={{
            bgcolor: "error.lighter",
            color: "error.main",
            fontWeight: "bold",
            "& .MuiChip-icon": { color: "error.main" },
          }}
        />
      );
    }

    if (nextPayment) {
      return (
        <Chip
          label="Em Andamento"
          size="small"
          icon={<Clock style={{ width: "0.75rem", height: "0.75rem" }} />}
          sx={{
            bgcolor: "info.lighter",
            color: "info.main",
            fontWeight: "bold",
            "& .MuiChip-icon": { color: "info.main" },
          }}
        />
      );
    }

    return <Chip label="Sem Parcelas" variant="outlined" size="small" />;
  };

  const handleDelete = async () => {
    await deleteInstallment(installment.id);
    setIsDeleteDialogOpen(false);
  };

  const handleEditClick = () => {
    setEditingInstallment(installment);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          title={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                noWrap
                sx={{ maxWidth: "60%" }}
              >
                {installment.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {getStatusBadge()}
                {showActions && (
                  <>
                    <IconButton
                      size="small"
                      onClick={handleMenuClick}
                      aria-controls={openMenu ? "installment-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={openMenu ? "true" : undefined}
                    >
                      <MoreVertical style={{ width: "1rem", height: "1rem" }} />
                    </IconButton>
                    <Menu
                      id="installment-menu"
                      anchorEl={anchorEl}
                      open={openMenu}
                      onClose={handleMenuClose}
                      MenuListProps={{
                        "aria-labelledby": "basic-button",
                      }}
                      transformOrigin={{ horizontal: "right", vertical: "top" }}
                      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    >
                      {!installment.isCompleted && nextPayment && (
                        <MenuItem
                          onClick={() => {
                            setIsPayDialogOpen(true);
                            handleMenuClose();
                          }}
                        >
                          <DollarSign
                            style={{
                              width: "1rem",
                              height: "1rem",
                              marginRight: "0.5rem",
                            }}
                          />
                          Registrar Pagamento
                        </MenuItem>
                      )}
                      <MenuItem
                        onClick={() => {
                          handleEditClick();
                          handleMenuClose();
                        }}
                      >
                        <Edit3
                          style={{
                            width: "1rem",
                            height: "1rem",
                            marginRight: "0.5rem",
                          }}
                        />
                        Editar
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setIsDeleteDialogOpen(true);
                          handleMenuClose();
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <Trash2
                          style={{
                            width: "1rem",
                            height: "1rem",
                            marginRight: "0.5rem",
                          }}
                        />
                        Excluir
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>
            </Box>
          }
          sx={{ pb: 1 }}
        />

        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {installment.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {installment.description}
            </Typography>
          )}

          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.875rem",
              }}
            >
              <Typography variant="body2">Progresso</Typography>
              <Typography variant="body2">
                {installment.paidInstallments}/{installment.totalInstallments}{" "}
                parcelas
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Stack>

          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                Valor Total
              </Typography>
              <Typography variant="body2" fontWeight="semibold">
                {formatCurrency(installment.totalAmount)}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                Valor da Parcela
              </Typography>
              <Typography variant="body2" fontWeight="semibold">
                {formatCurrency(installment.installmentAmount)}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                Total Pago
              </Typography>
              <Typography
                variant="body2"
                fontWeight="semibold"
                color="success.main"
              >
                {formatCurrency(installment.totalPaid)}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                Restante
              </Typography>
              <Typography
                variant="body2"
                fontWeight="semibold"
                color="warning.main"
              >
                {formatCurrency(installment.remainingAmount)}
              </Typography>
            </Grid>
          </Grid>

          {nextPayment && !installment.isCompleted && (
            <Box
              sx={{
                borderTop: 1,
                borderColor: "divider",
                pt: 2,
                mt: 1,
                bgcolor:
                  nextPayment.status === "overdue"
                    ? alpha(theme.palette.error.main, 0.05)
                    : "transparent",
                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
                mx: -3,
                mb: -3,
                px: 3,
                pb: 3,
              }}
            >
              {nextPayment.status === "overdue" && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                    color: "error.main",
                  }}
                >
                  <AlertTriangle style={{ width: "1rem", height: "1rem" }} />
                  <Typography variant="body2" fontWeight="medium">
                    Parcela em atraso!
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {nextPayment.status === "overdue"
                      ? "Venceu em"
                      : "Próximo Vencimento"}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="semibold"
                    color={
                      nextPayment.status === "overdue"
                        ? "text.primary"
                        : "inherit"
                    }
                  >
                    {format(parseISO(nextPayment.dueDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </Typography>
                  {nextPayment.status === "overdue" && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      {Math.floor(
                        (new Date().getTime() -
                          parseISO(nextPayment.dueDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      dias de atraso
                    </Typography>
                  )}
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Parcela {nextPayment.installmentNumber}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="semibold"
                    color={
                      nextPayment.status === "overdue"
                        ? "text.primary"
                        : "inherit"
                    }
                  >
                    {formatCurrency(nextPayment.scheduledAmount)}
                  </Typography>
                </Box>
              </Box>

              {overdueCount > 1 && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    border: 1,
                    borderColor: alpha(theme.palette.warning.main, 0.2),
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="warning.dark"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <AlertTriangle
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.25rem",
                      }}
                    />
                    Você tem{" "}
                    <Box component="span" fontWeight="bold" sx={{ mx: 0.5 }}>
                      {overdueCount} parcelas em atraso
                    </Box>
                  </Typography>
                </Box>
              )}

              {showActions && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      onClick={() => setIsPayDialogOpen(true)}
                      variant="contained"
                      color={
                        nextPayment.status === "overdue" ? "error" : "primary"
                      }
                      size="small"
                      sx={{ flex: { sm: 1 } }}
                      fullWidth
                    >
                      <DollarSign
                        style={{
                          width: "1rem",
                          height: "1rem",
                          marginRight: "0.5rem",
                        }}
                      />
                      Registrar
                    </Button>
                    {linkedContact && linkedPixKey && (
                      <PaymentButton
                        amount={nextPayment.scheduledAmount}
                        description={`Parcela ${nextPayment.installmentNumber}/${installment.totalInstallments} - ${installment.name}`}
                        receiverName={linkedContact.name}
                        receiverPixKey={linkedPixKey.pixKey}
                        bank={linkedPixKey.bank || "nubank"}
                        installmentId={installment.id}
                        recipientId={linkedContact.id}
                        size="small"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  </Stack>

                  {nextPayment.status === "overdue" && (
                    <Button
                      onClick={() => setIsMarkAsPaidOpen(true)}
                      variant="outlined"
                      size="small"
                      fullWidth
                    >
                      <CheckCircle2
                        style={{
                          width: "1rem",
                          height: "1rem",
                          marginRight: "0.5rem",
                        }}
                      />
                      Marcar como Pago
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          )}

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={installment.category}
              size="small"
              variant="outlined"
            />
            {installment.subcategory && (
              <Chip
                label={installment.subcategory}
                size="small"
                variant="outlined"
              />
            )}
            {installment.establishment && (
              <Chip
                label={installment.establishment}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <PayInstallmentDialog
        installment={installment}
        payment={nextPayment}
        open={isPayDialogOpen}
        onOpenChange={setIsPayDialogOpen}
      />

      <EditInstallmentDialog
        installment={editingInstallment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <MarkAsPaidDialog
        installment={installment}
        payment={nextPayment}
        open={isMarkAsPaidOpen}
        onOpenChange={setIsMarkAsPaidOpen}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o parcelamento "{installment.name}"?
            Esta ação não pode ser desfeita e todas as informações de pagamento
            serão perdidas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            startIcon={<Trash2 style={{ width: "1rem", height: "1rem" }} />}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
