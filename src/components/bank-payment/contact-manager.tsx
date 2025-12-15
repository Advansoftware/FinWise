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
  Paper,
  Collapse,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Pix as PixIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Key as KeyIcon,
} from "@mui/icons-material";
import { useBankPayment } from "@/hooks/use-bank-payment";
import {
  PaymentContact,
  SupportedBank,
  PixKeyType,
  ContactPixKey,
} from "@/core/ports/bank-payment.port";

// Banks list with "Outros" option
const BANKS: { value: SupportedBank; label: string; color: string }[] = [
  { value: "nubank", label: "Nubank", color: "#820AD1" },
  { value: "itau", label: "Itaú", color: "#FF6600" },
  { value: "bradesco", label: "Bradesco", color: "#CC092F" },
  { value: "santander", label: "Santander", color: "#EC0000" },
  { value: "bb", label: "Banco do Brasil", color: "#FEBE10" },
  { value: "caixa", label: "Caixa", color: "#005CA9" },
  { value: "inter", label: "Inter", color: "#FF7A00" },
  { value: "c6bank", label: "C6 Bank", color: "#1A1A1A" },
  { value: "picpay", label: "PicPay", color: "#21C25E" },
  { value: "mercadopago", label: "Mercado Pago", color: "#00A8E8" },
  { value: "pagbank", label: "PagBank", color: "#07A752" },
  { value: "neon", label: "Neon", color: "#00EAFF" },
  { value: "next", label: "Next", color: "#00E676" },
  { value: "sicoob", label: "Sicoob", color: "#003641" },
  { value: "sicredi", label: "Sicredi", color: "#33A02C" },
  { value: "banrisul", label: "Banrisul", color: "#00529B" },
  { value: "outros", label: "Outro Banco", color: "#757575" },
];

const PIX_KEY_TYPES: { value: PixKeyType; label: string }[] = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

interface PixKeyFormData {
  pixKeyType: PixKeyType;
  pixKey: string;
  bank: SupportedBank;
  bankName?: string;
  label?: string;
  isDefault: boolean;
}

interface ContactFormData {
  name: string;
  nickname?: string;
  document?: string;
  notes?: string;
  isFavorite: boolean;
  pixKeys: PixKeyFormData[];
}

const initialPixKey: PixKeyFormData = {
  pixKeyType: "cpf",
  pixKey: "",
  bank: "nubank",
  bankName: "",
  label: "",
  isDefault: true,
};

const initialFormData: ContactFormData = {
  name: "",
  nickname: "",
  document: "",
  notes: "",
  isFavorite: false,
  pixKeys: [{ ...initialPixKey }],
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
  const [editingContact, setEditingContact] = useState<PaymentContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedContact, setSelectedContact] = useState<PaymentContact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  // Get default PIX key from contact
  const getDefaultPixKey = (contact: PaymentContact): ContactPixKey | null => {
    if (!contact.pixKeys || contact.pixKeys.length === 0) {
      // Compatibilidade com estrutura antiga
      if (contact.pixKey && contact.pixKeyType) {
        return {
          id: 'legacy',
          pixKeyType: contact.pixKeyType,
          pixKey: contact.pixKey,
          bank: contact.bank,
          bankName: contact.bankName,
          isDefault: true,
          createdAt: contact.createdAt,
        };
      }
      return null;
    }
    return contact.pixKeys.find(k => k.isDefault) || contact.pixKeys[0];
  };

  // Open dialog for new contact
  const handleAddClick = () => {
    setEditingContact(null);
    setFormData(initialFormData);
    setError(null);
    setDialogOpen(true);
  };

  // Open dialog to edit contact
  const handleEditClick = (contact: PaymentContact) => {
    setEditingContact(contact);
    
    // Convert contact to form data
    const pixKeys: PixKeyFormData[] = contact.pixKeys?.map(k => ({
      pixKeyType: k.pixKeyType,
      pixKey: k.pixKey,
      bank: k.bank || 'outros',
      bankName: k.bankName,
      label: k.label,
      isDefault: k.isDefault,
    })) || [];

    // If no pixKeys, use legacy fields
    if (pixKeys.length === 0 && contact.pixKey && contact.pixKeyType) {
      pixKeys.push({
        pixKeyType: contact.pixKeyType,
        pixKey: contact.pixKey,
        bank: contact.bank || 'outros',
        bankName: contact.bankName,
        label: '',
        isDefault: true,
      });
    }

    // Ensure at least one key
    if (pixKeys.length === 0) {
      pixKeys.push({ ...initialPixKey });
    }

    setFormData({
      name: contact.name,
      nickname: contact.nickname || '',
      document: contact.document || '',
      notes: contact.notes || '',
      isFavorite: contact.isFavorite,
      pixKeys,
    });
    setError(null);
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContact(null);
    setFormData(initialFormData);
    setError(null);
  };

  // Add new PIX key to form
  const handleAddPixKey = () => {
    setFormData(prev => ({
      ...prev,
      pixKeys: [...prev.pixKeys, { ...initialPixKey, isDefault: false }],
    }));
  };

  // Remove PIX key from form
  const handleRemovePixKey = (index: number) => {
    if (formData.pixKeys.length <= 1) return;
    
    const wasDefault = formData.pixKeys[index].isDefault;
    const newKeys = formData.pixKeys.filter((_, i) => i !== index);
    
    // If removed key was default, make first one default
    if (wasDefault && newKeys.length > 0) {
      newKeys[0].isDefault = true;
    }
    
    setFormData(prev => ({ ...prev, pixKeys: newKeys }));
  };

  // Update PIX key in form
  const handleUpdatePixKey = (index: number, field: keyof PixKeyFormData, value: any) => {
    setFormData(prev => {
      const newKeys = [...prev.pixKeys];
      newKeys[index] = { ...newKeys[index], [field]: value };
      
      // If setting this as default, unset others
      if (field === 'isDefault' && value === true) {
        newKeys.forEach((k, i) => {
          if (i !== index) k.isDefault = false;
        });
      }
      
      return { ...prev, pixKeys: newKeys };
    });
  };

  // Save contact
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    
    // Validate PIX keys
    for (const key of formData.pixKeys) {
      if (!key.pixKey.trim()) {
        setError("Todas as chaves PIX devem ser preenchidas");
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const contactData = {
        name: formData.name,
        nickname: formData.nickname || undefined,
        document: formData.document || undefined,
        notes: formData.notes || undefined,
        isFavorite: formData.isFavorite,
        pixKeys: formData.pixKeys.map(k => ({
          pixKeyType: k.pixKeyType,
          pixKey: k.pixKey,
          bank: k.bank,
          bankName: k.bank === 'outros' ? k.bankName : undefined,
          label: k.label || undefined,
          isDefault: k.isDefault,
        })),
      };

      if (editingContact) {
        await updateContact(editingContact.id, contactData);
      } else {
        await createContact(contactData);
      }
      handleCloseDialog();
      refreshContacts();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar contato");
    } finally {
      setSaving(false);
    }
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contact: PaymentContact) => {
    setMenuAnchor(event.currentTarget);
    setSelectedContact(contact);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedContact(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

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

  const handleToggleFavorite = async (contact: PaymentContact) => {
    try {
      await updateContact(contact.id, { isFavorite: !contact.isFavorite });
      refreshContacts();
    } catch (err: any) {
      console.error("Erro ao atualizar favorito:", err);
    }
    setMenuAnchor(null);
  };

  // Helpers
  const getBankColor = (bank?: SupportedBank) => {
    return BANKS.find(b => b.value === bank)?.color || "#757575";
  };

  const getBankLabel = (bank?: SupportedBank, bankName?: string) => {
    if (bank === 'outros' && bankName) return bankName;
    return BANKS.find(b => b.value === bank)?.label || "Outro";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const toggleExpandContact = (id: string) => {
    setExpandedContact(prev => prev === id ? null : id);
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Contatos de Pagamento</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
          Novo Contato
        </Button>
      </Stack>

      {/* Contact list */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : contacts.length === 0 ? (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} py={4}>
              <PersonIcon sx={{ fontSize: 48, color: "grey.400" }} />
              <Typography color="text.secondary">Nenhum contato cadastrado</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddClick}>
                Adicionar Contato
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {contacts.map((contact) => {
            const defaultKey = getDefaultPixKey(contact);
            const keyCount = contact.pixKeys?.length || (contact.pixKey ? 1 : 0);
            const isExpanded = expandedContact === contact.id;

            return (
              <Card key={contact.id} variant="outlined">
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: getBankColor(defaultKey?.bank), width: 40, height: 40 }}>
                      {getInitials(contact.name)}
                    </Avatar>

                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight="medium">
                          {contact.name}
                        </Typography>
                        {contact.isFavorite && (
                          <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
                        )}
                      </Stack>
                      {defaultKey && (
                        <Stack direction="row" alignItems="center" gap={1} mt={0.5}>
                          <Chip
                            label={getBankLabel(defaultKey.bank, defaultKey.bankName)}
                            size="small"
                            sx={{
                              bgcolor: getBankColor(defaultKey.bank),
                              color: "white",
                              fontSize: "0.7rem",
                              height: 20,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {defaultKey.pixKeyType.toUpperCase()}: {defaultKey.pixKey}
                          </Typography>
                          {keyCount > 1 && (
                            <Chip
                              label={`+${keyCount - 1}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.65rem" }}
                              onClick={() => toggleExpandContact(contact.id)}
                            />
                          )}
                        </Stack>
                      )}
                    </Box>

                    {keyCount > 1 && (
                      <IconButton size="small" onClick={() => toggleExpandContact(contact.id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}

                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, contact)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>

                  {/* Expanded PIX keys */}
                  <Collapse in={isExpanded}>
                    <Stack spacing={1} mt={2} pl={7}>
                      {contact.pixKeys?.map((key, idx) => (
                        <Paper
                          key={key.id || idx}
                          variant="outlined"
                          sx={{
                            p: 1,
                            bgcolor: key.isDefault ? 'action.selected' : 'transparent',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <KeyIcon fontSize="small" color={key.isDefault ? "primary" : "disabled"} />
                            <Chip
                              label={getBankLabel(key.bank, key.bankName)}
                              size="small"
                              sx={{
                                bgcolor: getBankColor(key.bank),
                                color: "white",
                                fontSize: "0.65rem",
                                height: 18,
                              }}
                            />
                            <Typography variant="caption" flex={1}>
                              {key.label && `(${key.label}) `}
                              {key.pixKeyType.toUpperCase()}: {key.pixKey}
                            </Typography>
                            {key.isDefault && (
                              <Chip label="Padrão" size="small" color="primary" sx={{ height: 18, fontSize: "0.6rem" }} />
                            )}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Action menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => selectedContact && handleToggleFavorite(selectedContact)}>
          <ListItemIcon>
            {selectedContact?.isFavorite ? <StarBorderIcon fontSize="small" /> : <StarIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedContact?.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedContact && handleEditClick(selectedContact)}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingContact ? "Editar Contato" : "Novo Contato"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {/* Contact info */}
            <TextField
              label="Nome *"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><PersonIcon /></InputAdornment>
                ),
              }}
            />

            <TextField
              label="Apelido"
              fullWidth
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="Ex: João do Trabalho"
            />

            <Divider />

            {/* PIX Keys */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Chaves PIX</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddPixKey}>
                Adicionar Chave
              </Button>
            </Stack>

            {formData.pixKeys.map((key, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="medium">
                        Chave {index + 1}
                      </Typography>
                      {key.isDefault && (
                        <Chip label="Padrão" size="small" color="primary" sx={{ height: 20 }} />
                      )}
                    </Stack>
                    <Stack direction="row" gap={0.5}>
                      {!key.isDefault && (
                        <Button
                          size="small"
                          onClick={() => handleUpdatePixKey(index, 'isDefault', true)}
                        >
                          Definir como padrão
                        </Button>
                      )}
                      {formData.pixKeys.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => handleRemovePixKey(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={key.pixKeyType}
                        label="Tipo"
                        onChange={(e) => handleUpdatePixKey(index, 'pixKeyType', e.target.value)}
                      >
                        {PIX_KEY_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Chave PIX *"
                      size="small"
                      fullWidth
                      value={key.pixKey}
                      onChange={(e) => handleUpdatePixKey(index, 'pixKey', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start"><PixIcon fontSize="small" /></InputAdornment>
                        ),
                      }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Banco</InputLabel>
                      <Select
                        value={key.bank}
                        label="Banco"
                        onChange={(e) => handleUpdatePixKey(index, 'bank', e.target.value)}
                      >
                        {BANKS.map((bank) => (
                          <MenuItem key={bank.value} value={bank.value}>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: bank.color }} />
                              {bank.label}
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {key.bank === 'outros' && (
                      <TextField
                        label="Nome do Banco"
                        size="small"
                        fullWidth
                        value={key.bankName || ''}
                        onChange={(e) => handleUpdatePixKey(index, 'bankName', e.target.value)}
                        placeholder="Digite o nome do banco"
                      />
                    )}

                    <TextField
                      label="Rótulo"
                      size="small"
                      fullWidth
                      value={key.label || ''}
                      onChange={(e) => handleUpdatePixKey(index, 'label', e.target.value)}
                      placeholder="Ex: Pessoal, Trabalho"
                    />
                  </Stack>
                </Stack>
              </Paper>
            ))}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Excluir Contato</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o contato "{selectedContact?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>Cancelar</Button>
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
