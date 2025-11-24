"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Pix as PixIcon,
  AccountBalance as AccountBalanceIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { useBankPayment } from "@/hooks/use-bank-payment";
import {
  PaymentContact,
  SupportedBank,
  PixKeyType,
} from "@/core/ports/bank-payment.port";

const BANKS: { value: SupportedBank; label: string; color: string }[] = [
  { value: "nubank", label: "Nubank", color: "#820AD1" },
  { value: "itau", label: "Itaú", color: "#FF6600" },
  { value: "bradesco", label: "Bradesco", color: "#CC092F" },
  { value: "santander", label: "Santander", color: "#EC0000" },
  { value: "inter", label: "Inter", color: "#FF7A00" },
  { value: "c6bank", label: "C6 Bank", color: "#1A1A1A" },
  { value: "picpay", label: "PicPay", color: "#21C25E" },
  { value: "mercadopago", label: "Mercado Pago", color: "#00A8E8" },
];

const PIX_KEY_TYPES: { value: PixKeyType; label: string }[] = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

interface ContactFormData {
  name: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  bank: SupportedBank;
  isFavorite: boolean;
}

const initialFormData: ContactFormData = {
  name: "",
  pixKey: "",
  pixKeyType: "cpf",
  bank: "nubank",
  isFavorite: false,
};

export function ContactManager() {
  const {
    contacts,
    createContact,
    updateContact,
    deleteContact,
    loading,
    refreshContacts,
  } = useBankPayment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<PaymentContact | null>(
    null
  );
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedContact, setSelectedContact] = useState<PaymentContact | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Abrir diálogo para novo contato
  const handleAddClick = () => {
    setEditingContact(null);
    setFormData(initialFormData);
    setError(null);
    setDialogOpen(true);
  };

  // Abrir diálogo para editar contato
  const handleEditClick = (contact: PaymentContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      pixKey: contact.pixKey,
      pixKeyType: contact.pixKeyType,
      bank: contact.bank || "nubank",
      isFavorite: contact.isFavorite,
    });
    setError(null);
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  // Fechar diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContact(null);
    setFormData(initialFormData);
    setError(null);
  };

  // Salvar contato
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (!formData.pixKey.trim()) {
      setError("Chave PIX é obrigatória");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await createContact(formData);
      }
      handleCloseDialog();
      refreshContacts();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar contato");
    } finally {
      setSaving(false);
    }
  };

  // Abrir menu
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    contact: PaymentContact
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedContact(contact);
  };

  // Fechar menu
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedContact(null);
  };

  // Abrir diálogo de exclusão
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!selectedContact) return;

    setSaving(true);
    try {
      await deleteContact(selectedContact.id);
      refreshContacts();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir contato");
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setSelectedContact(null);
    }
  };

  // Toggle favorito
  const handleToggleFavorite = async (contact: PaymentContact) => {
    try {
      await updateContact(contact.id, { isFavorite: !contact.isFavorite });
      refreshContacts();
    } catch (err: any) {
      console.error("Erro ao atualizar favorito:", err);
    }
    setMenuAnchor(null);
  };

  // Obter cor do banco
  const getBankColor = (bank: SupportedBank) => {
    return BANKS.find((b) => b.value === bank)?.color || "#1976d2";
  };

  // Obter label do banco
  const getBankLabel = (bank: SupportedBank) => {
    return BANKS.find((b) => b.value === bank)?.label || bank;
  };

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Contatos de Pagamento</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          size="small"
        >
          Novo Contato
        </Button>
      </Stack>

      {/* Lista de contatos */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : contacts.length === 0 ? (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} py={4}>
              <PersonIcon sx={{ fontSize: 48, color: "grey.400" }} />
              <Typography color="text.secondary">
                Nenhum contato cadastrado
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
              >
                Adicionar Contato
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {contacts.map((contact) => (
            <Card key={contact.id} variant="outlined">
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    sx={{
                      bgcolor: getBankColor(contact.bank || "nubank"),
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getInitials(contact.name)}
                  </Avatar>

                  <Box flex={1}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {contact.name}
                      </Typography>
                      {contact.isFavorite && (
                        <StarIcon
                          sx={{ fontSize: 16, color: "warning.main" }}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1} mt={0.5}>
                      <Chip
                        label={getBankLabel(contact.bank || "nubank")}
                        size="small"
                        sx={{
                          bgcolor: getBankColor(contact.bank || "nubank"),
                          color: "white",
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {contact.pixKeyType.toUpperCase()}: {contact.pixKey}
                      </Typography>
                    </Stack>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, contact)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() =>
            selectedContact && handleToggleFavorite(selectedContact)
          }
        >
          <ListItemIcon>
            {selectedContact?.isFavorite ? (
              <StarBorderIcon fontSize="small" />
            ) : (
              <StarIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedContact?.isFavorite
              ? "Remover dos favoritos"
              : "Adicionar aos favoritos"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => selectedContact && handleEditClick(selectedContact)}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo de criação/edição */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingContact ? "Editar Contato" : "Novo Contato"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Chave PIX</InputLabel>
              <Select
                value={formData.pixKeyType}
                label="Tipo de Chave PIX"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pixKeyType: e.target.value as PixKeyType,
                  })
                }
              >
                {PIX_KEY_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Chave PIX"
              fullWidth
              value={formData.pixKey}
              onChange={(e) =>
                setFormData({ ...formData, pixKey: e.target.value })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PixIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Banco</InputLabel>
              <Select
                value={formData.bank}
                label="Banco"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank: e.target.value as SupportedBank,
                  })
                }
              >
                {BANKS.map((bank) => (
                  <MenuItem key={bank.value} value={bank.value}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: 0.5,
                          bgcolor: bank.color,
                        }}
                      />
                      {bank.label}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Excluir Contato</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o contato "{selectedContact?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {saving ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
