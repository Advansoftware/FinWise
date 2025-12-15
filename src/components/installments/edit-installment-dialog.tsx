// src/components/installments/edit-installment-dialog.tsx

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import { Pix as PixIcon } from "@mui/icons-material";
import { Loader2, Edit3, X } from "lucide-react";
import { Installment } from "@/core/ports/installments.port";
import { useInstallments } from "@/hooks/use-installments";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { useBankPayment } from "@/hooks/use-bank-payment";

const editInstallmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  subcategory: z.string().optional(),
  establishment: z.string().optional(),
  sourceWalletId: z.string().min(1, "A carteira de origem é obrigatória"),
});

type EditInstallmentForm = z.infer<typeof editInstallmentSchema>;

interface EditInstallmentDialogProps {
  installment: Installment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInstallmentDialog({
  installment,
  open,
  onOpenChange,
}: EditInstallmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateInstallment } = useInstallments();
  const { wallets } = useWallets();
  const { categories, subcategories } = useTransactions();
  const { contacts } = useBankPayment();

  // State for contact/PIX key selection
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>("");

  const availableCategories = categories;

  // Function to get a valid wallet ID, fallback to first available if original doesn't exist
  const getValidWalletId = () => {
    if (installment?.sourceWalletId) {
      const walletExists = wallets.find(
        (w) => w.id === installment.sourceWalletId
      );
      if (walletExists) {
        return installment.sourceWalletId;
      }
    }
    return wallets.length > 0 ? wallets[0].id : "";
  };

  const form = useForm<EditInstallmentForm>({
    resolver: zodResolver(editInstallmentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      subcategory: "",
      establishment: "",
      sourceWalletId: "",
    },
  });

  const selectedCategory = form.watch("category");
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return subcategories[selectedCategory as keyof typeof subcategories] || [];
  }, [selectedCategory, subcategories]);

  // Get selected contact and its PIX keys
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId),
    [contacts, selectedContactId]
  );

  const availablePixKeys = useMemo(() => {
    if (!selectedContact) return [];
    // Support both new pixKeys array and legacy single key
    if (selectedContact.pixKeys && selectedContact.pixKeys.length > 0) {
      return selectedContact.pixKeys;
    }
    if (selectedContact.pixKey && selectedContact.pixKeyType) {
      return [
        {
          id: "legacy",
          pixKeyType: selectedContact.pixKeyType,
          pixKey: selectedContact.pixKey,
          bank: selectedContact.bank,
          bankName: selectedContact.bankName,
          isDefault: true,
          createdAt: selectedContact.createdAt,
        },
      ];
    }
    return [];
  }, [selectedContact]);

  // Reset form when installment changes
  useEffect(() => {
    if (installment && open) {
      form.reset({
        name: installment.name,
        description: installment.description || "",
        category: installment.category,
        subcategory: installment.subcategory || "",
        establishment: installment.establishment || "",
        sourceWalletId: getValidWalletId(),
      });
      // Initialize contact and PIX key from installment
      setSelectedContactId(installment.contactId || "");
      setSelectedPixKeyId(installment.pixKeyId || "");
    }
  }, [installment, open, form, wallets]);

  // Auto-select default PIX key when contact changes (only if not already set from installment)
  useEffect(() => {
    if (availablePixKeys.length > 0 && !selectedPixKeyId) {
      const defaultKey =
        availablePixKeys.find((k) => k.isDefault) || availablePixKeys[0];
      setSelectedPixKeyId(defaultKey.id);
    } else if (availablePixKeys.length === 0) {
      setSelectedPixKeyId("");
    }
  }, [availablePixKeys, selectedPixKeyId]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory) {
      const currentSubcategory = form.getValues("subcategory");
      if (
        currentSubcategory &&
        !availableSubcategories.includes(currentSubcategory)
      ) {
        form.setValue("subcategory", "");
      }
    }
  }, [selectedCategory, availableSubcategories, form]);

  const onSubmit = async (data: EditInstallmentForm) => {
    if (!installment) return;

    setIsSubmitting(true);
    try {
      const success = await updateInstallment(installment.id, {
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || undefined,
        establishment: data.establishment,
        sourceWalletId: data.sourceWalletId,
        // Contact PIX for payment - use null to clear if not selected
        contactId: selectedContactId || null,
        pixKeyId: selectedPixKeyId || null,
        updatedAt: new Date().toISOString(),
      } as any);

      if (success) {
        onOpenChange(false);
        form.reset();
        setSelectedContactId("");
        setSelectedPixKeyId("");
      }
    } catch (error: any) {
      console.error("Erro ao atualizar parcelamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!installment) return null;

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Edit3 style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>Editar Parcelamento</span>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: "normal" }}
          >
            Atualize as informações do parcelamento "{installment.name}"
          </Typography>
        </Box>
        <IconButton onClick={() => onOpenChange(false)} size="small">
          <X style={{ width: "1.25rem", height: "1.25rem" }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <form onSubmit={form.handleSubmit(onSubmit)} id="edit-installment-form">
          <Stack spacing={3}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
              }}
            >
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Nome do Parcelamento"
                    placeholder="Ex: Compra no Magazine Luiza"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                    sx={{ gridColumn: { md: "span 2" } }}
                  />
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Descrição (Opcional)"
                    placeholder="Detalhes sobre o parcelamento..."
                    multiline
                    rows={2}
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                    sx={{ gridColumn: { md: "span 2" } }}
                  />
                )}
              />

              <Box
                sx={{
                  gridColumn: { md: "span 2" },
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                }}
              >
                <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Valor Total
                  </Typography>
                  <Typography variant="h6" fontWeight="semibold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(installment.totalAmount)}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Nº de Parcelas
                  </Typography>
                  <Typography variant="h6" fontWeight="semibold">
                    {installment.paidInstallments}/
                    {installment.totalInstallments}
                  </Typography>
                </Box>
              </Box>

              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      {...field}
                      label="Categoria"
                      value={field.value || ""}
                    >
                      {availableCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{error?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                name="subcategory"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Subcategoria (Opcional)</InputLabel>
                    <Select
                      {...field}
                      label="Subcategoria (Opcional)"
                      value={field.value || ""}
                      disabled={
                        !selectedCategory || availableSubcategories.length === 0
                      }
                    >
                      {availableSubcategories.map((subcategory) => (
                        <MenuItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{error?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                name="establishment"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Estabelecimento (Opcional)"
                    placeholder="Ex: Loja ABC, Magazine Luiza..."
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                    sx={{ gridColumn: { md: "span 2" } }}
                  />
                )}
              />

              <Controller
                name="sourceWalletId"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl
                    fullWidth
                    error={!!error}
                    sx={{ gridColumn: { md: "span 2" } }}
                  >
                    <InputLabel>Carteira de Origem</InputLabel>
                    <Select
                      {...field}
                      label="Carteira de Origem"
                      value={field.value || ""}
                    >
                      {wallets.map((wallet) => (
                        <MenuItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{error?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              {/* Contact PIX for payment */}
              <Box sx={{ gridColumn: { md: "span 2" } }}>
                <Divider sx={{ my: 1 }}>
                  <Chip
                    icon={<PixIcon />}
                    label="Contato PIX (Opcional)"
                    size="small"
                    variant="outlined"
                  />
                </Divider>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Contato de Pagamento</InputLabel>
                <Select
                  value={selectedContactId}
                  label="Contato de Pagamento"
                  onChange={(e) => {
                    setSelectedContactId(e.target.value);
                    setSelectedPixKeyId(""); // Reset PIX key when contact changes
                  }}
                >
                  <MenuItem value="">
                    <em>Nenhum (pagar manualmente)</em>
                  </MenuItem>
                  {contacts.map((contact) => (
                    <MenuItem key={contact.id} value={contact.id}>
                      {contact.name}
                      {contact.isFavorite && " ⭐"}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Vincule a um contato para pagamento rápido via PIX
                </FormHelperText>
              </FormControl>

              {selectedContactId && availablePixKeys.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Chave PIX</InputLabel>
                  <Select
                    value={selectedPixKeyId}
                    label="Chave PIX"
                    onChange={(e) => setSelectedPixKeyId(e.target.value)}
                  >
                    {availablePixKeys.map((key) => (
                      <MenuItem key={key.id} value={key.id}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {key.label ? `${key.label} - ` : ""}
                            {key.pixKeyType.toUpperCase()}: {key.pixKey}
                          </Typography>
                          {key.isDefault && (
                            <Chip
                              label="Padrão"
                              size="small"
                              color="primary"
                              sx={{ height: 18, fontSize: "0.6rem" }}
                            />
                          )}
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="edit-installment-form"
          disabled={isSubmitting}
          variant="contained"
          startIcon={
            isSubmitting ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          Salvar Alterações
        </Button>
      </DialogActions>
    </Dialog>
  );
}
