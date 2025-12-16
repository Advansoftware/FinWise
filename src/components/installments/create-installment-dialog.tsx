// src/components/installments/create-installment-dialog.tsx

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
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Stack,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
  Grid,
  useMediaQuery,
  Switch,
  Collapse,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  Loader2,
  Plus,
  Repeat,
  Clock,
  Calendar as CalendarIcon,
  X,
  Settings2,
  Edit3,
} from "lucide-react";
import { Installment } from "@/core/ports/installments.port";
import { Pix as PixIcon } from "@mui/icons-material";
import { useInstallments } from "@/hooks/use-installments";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { useBankPayment } from "@/hooks/use-bank-payment";
import { format } from "date-fns";
import { getFeatureFlags } from "@/lib/feature-flags";

const { openFinance: isOpenFinanceEnabled } = getFeatureFlags();

const installmentSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    totalAmount: z
      .string()
      .min(1, "Valor total é obrigatório")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        "Valor deve ser maior que zero"
      ),
    totalInstallments: z.string().optional(),
    category: z.string().min(1, "Categoria é obrigatória"),
    subcategory: z.string().optional(),
    establishment: z.string().optional(),
    startDate: z.date({ required_error: "Data de início é obrigatória" }),
    sourceWalletId: z.string().min(1, "Carteira de origem é obrigatória"),
    isRecurring: z.boolean().default(false),
    recurringType: z.enum(["monthly", "yearly"]).optional(),
    endDate: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    // Validações específicas para parcelamentos recorrentes
    if (data.isRecurring) {
      // Para recorrentes, recurringType é obrigatório
      if (!data.recurringType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Tipo de recorrência é obrigatório para parcelamentos recorrentes",
          path: ["recurringType"],
        });
      }
    } else {
      // Para parcelamentos normais, totalInstallments é obrigatório e deve ser válido
      if (!data.totalInstallments || data.totalInstallments.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Número de parcelas é obrigatório",
          path: ["totalInstallments"],
        });
      } else {
        const installments = Number(data.totalInstallments);
        if (isNaN(installments) || installments <= 0 || installments > 120) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Número de parcelas deve ser entre 1 e 120",
            path: ["totalInstallments"],
          });
        }
      }
    }
  });

type InstallmentForm = z.infer<typeof installmentSchema>;

interface CreateInstallmentDialogProps {
  open: boolean;
  onClose: () => void;
  /** Parcelamento para edição - se fornecido, o dialog entra em modo de edição */
  installment?: Installment | null;
}

export function CreateInstallmentDialog({
  open,
  onClose,
  installment,
}: CreateInstallmentDialogProps) {
  const isEditMode = !!installment;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualValues, setIsManualValues] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<number[]>([]);
  const { createInstallment, updateInstallment } = useInstallments();
  const { wallets } = useWallets();
  const { categories, subcategories } = useTransactions();
  const { contacts } = useBankPayment();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State for optional contact/PIX key selection
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>("");

  const form = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      name: "",
      description: "",
      totalAmount: "",
      totalInstallments: "",
      category: "",
      subcategory: "",
      establishment: "",
      sourceWalletId: "",
      isRecurring: false,
      recurringType: "monthly",
      startDate: new Date(),
    },
  });

  const isRecurring = form.watch("isRecurring");
  const selectedCategory = form.watch("category");
  const totalAmount = Number(form.watch("totalAmount") || 0);
  const totalInstallments = Number(form.watch("totalInstallments") || 0);
  const installmentAmount =
    totalInstallments > 0 ? totalAmount / totalInstallments : 0;

  // Track if we've initialized for edit mode to prevent re-initialization
  const [hasInitializedEdit, setHasInitializedEdit] = useState(false);

  // Preencher formulário quando em modo de edição
  useEffect(() => {
    if (installment && open && !hasInitializedEdit) {
      // Find valid wallet ID
      const validWalletId =
        installment.sourceWalletId &&
        wallets.find((w) => w.id === installment.sourceWalletId)
          ? installment.sourceWalletId
          : wallets.length > 0
          ? wallets[0].id
          : "";

      form.reset({
        name: installment.name,
        description: installment.description || "",
        totalAmount: String(installment.totalAmount),
        totalInstallments: installment.isRecurring
          ? ""
          : String(installment.totalInstallments),
        category: installment.category,
        subcategory: installment.subcategory || "",
        establishment: installment.establishment || "",
        sourceWalletId: validWalletId,
        isRecurring: installment.isRecurring || false,
        recurringType: installment.recurringType || "monthly",
        startDate: new Date(installment.startDate),
        endDate: installment.endDate
          ? new Date(installment.endDate)
          : undefined,
      });

      // Initialize contact and PIX key from installment
      const contactId = installment.contactId || "";
      setSelectedContactId(contactId);
      setPrevContactId(contactId); // Sync to prevent auto-select from overwriting
      setSelectedPixKeyId(installment.pixKeyId || "");
      setHasInitializedEdit(true);
    }
  }, [installment, open, wallets, form, hasInitializedEdit]);

  // Reset initialization flag when dialog closes or installment changes
  useEffect(() => {
    if (!open) {
      setHasInitializedEdit(false);
      setUserSelectedPixKey(false);
      setPrevContactId("");
    }
  }, [open]);

  // Atualizar customAmounts quando totalInstallments ou totalAmount mudar
  useEffect(() => {
    if (totalInstallments > 0 && totalAmount > 0 && isManualValues) {
      const defaultValue = parseFloat(
        (totalAmount / totalInstallments).toFixed(2)
      );
      setCustomAmounts(Array(totalInstallments).fill(defaultValue));
    } else if (!isManualValues) {
      setCustomAmounts([]);
    }
  }, [totalInstallments, totalAmount, isManualValues]);

  // Calcular soma dos valores customizados
  const customAmountsSum = customAmounts.reduce(
    (acc, val) => acc + (val || 0),
    0
  );
  const customAmountsDiff = Math.abs(customAmountsSum - totalAmount);
  const isCustomAmountsValid = customAmountsDiff < 0.01; // Tolerância para erros de ponto flutuante

  // Limpar campos específicos quando alternar entre recorrente e não recorrente
  useEffect(() => {
    if (isRecurring) {
      // Quando ativar recorrente, limpar o número de parcelas
      form.setValue("totalInstallments", "");
      // Garantir que o tipo de recorrência tenha um valor padrão
      if (!form.getValues("recurringType")) {
        form.setValue("recurringType", "monthly");
      }
    } else {
      // Quando desativar recorrente, limpar data de fim e tipo de recorrência
      form.setValue("endDate", undefined);
      form.setValue("recurringType", undefined);
    }
  }, [isRecurring, form]);

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

  // Track previous contact to detect contact changes
  const [prevContactId, setPrevContactId] = useState<string>("");
  // Track if user has manually selected a PIX key
  const [userSelectedPixKey, setUserSelectedPixKey] = useState(false);

  // Auto-select default PIX key when contact changes
  useEffect(() => {
    // Only auto-select when contact actually changes AND user hasn't manually selected
    if (selectedContactId !== prevContactId) {
      setPrevContactId(selectedContactId);
      setUserSelectedPixKey(false); // Reset manual selection flag when contact changes

      // Get PIX keys from the selected contact directly (not from memo which might be stale)
      const contact = contacts.find((c) => c.id === selectedContactId);
      if (contact) {
        let pixKeys: typeof availablePixKeys = [];
        if (contact.pixKeys && contact.pixKeys.length > 0) {
          pixKeys = contact.pixKeys;
        } else if (contact.pixKey && contact.pixKeyType) {
          pixKeys = [
            {
              id: "legacy",
              pixKeyType: contact.pixKeyType,
              pixKey: contact.pixKey,
              bank: contact.bank,
              bankName: contact.bankName,
              isDefault: true,
              createdAt: contact.createdAt,
            },
          ];
        }

        if (pixKeys.length > 0) {
          const defaultKey = pixKeys.find((k) => k.isDefault) || pixKeys[0];
          setSelectedPixKeyId(defaultKey.id);
        } else {
          setSelectedPixKeyId("");
        }
      } else {
        setSelectedPixKeyId("");
      }
    }
  }, [selectedContactId, prevContactId, contacts]);

  const onSubmit = async (data: InstallmentForm) => {
    // Validar valores customizados se habilitado (apenas para criação)
    if (!isEditMode && isManualValues && !isCustomAmountsValid) {
      return; // Não submeter se valores não batem
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && installment) {
        // Modo de edição - apenas atualiza campos editáveis
        const updateData = {
          name: data.name,
          description: data.description || undefined,
          category: data.category,
          subcategory: data.subcategory || undefined,
          establishment: data.establishment || undefined,
          sourceWalletId: data.sourceWalletId,
          // Contact PIX for payment - use null to clear if not selected
          contactId: selectedContactId || null,
          pixKeyId: selectedPixKeyId || null,
          updatedAt: new Date().toISOString(),
        };

        const success = await updateInstallment(
          installment.id,
          updateData as any
        );

        if (success) {
          onClose();
          form.reset();
          setSelectedContactId("");
          setSelectedPixKeyId("");
          setHasInitializedEdit(false);
        }
      } else {
        // Modo de criação
        const installmentData = {
          name: data.name,
          description: data.description || undefined,
          totalAmount: Number(data.totalAmount),
          totalInstallments: data.isRecurring
            ? 999999
            : Number(data.totalInstallments), // Valor alto para recorrentes
          category: data.category,
          subcategory: data.subcategory || undefined,
          establishment: data.establishment || undefined,
          startDate: data.startDate.toISOString(),
          sourceWalletId: data.sourceWalletId,
          isRecurring: data.isRecurring,
          recurringType: data.isRecurring ? data.recurringType : undefined,
          endDate: data.endDate?.toISOString(),
          // Contact PIX for payment
          contactId: selectedContactId || undefined,
          pixKeyId: selectedPixKeyId || undefined,
          // Incluir valores customizados se habilitado
          customInstallmentAmounts:
            isManualValues && customAmounts.length > 0
              ? customAmounts
              : undefined,
        };

        const newInstallment = await createInstallment(installmentData);

        if (newInstallment) {
          onClose();
          form.reset();
          setIsManualValues(false);
          setCustomAmounts([]);
          setSelectedContactId("");
          setSelectedPixKeyId("");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      sx={{
        // Garantir que o dialog fique acima do bottom nav
        zIndex: isMobile ? 1300 : undefined,
      }}
      slotProps={{
        paper: {
          sx: isMobile
            ? {
                margin: 0,
                maxHeight: "100%",
                maxWidth: "100%",
                borderRadius: 0,
              }
            : undefined,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 1.5, md: 2 },
        }}
      >
        <Box>
          <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="bold">
            {isEditMode ? "Editar Parcelamento" : "Novo Parcelamento"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {isEditMode
              ? `Atualize as informações do parcelamento "${installment?.name}"`
              : "Crie um novo parcelamento para acompanhar suas prestações."}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X style={{ width: "1.25rem", height: "1.25rem" }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          id="create-installment-form"
        >
          <Stack spacing={{ xs: 2, md: 3 }}>
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              <Grid size={12}>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Nome do Parcelamento"
                      placeholder="Ex: Notebook Dell, Sofá da Loja X..."
                      error={!!error}
                      helperText={error?.message}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              <Grid size={12}>
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Descrição (Opcional)"
                      placeholder="Informações adicionais..."
                      multiline
                      rows={2}
                      error={!!error}
                      helperText={error?.message}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              {/* Modo de edição: mostrar valores como read-only */}
              {isEditMode && installment && (
                <Grid size={12}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}
                    >
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
                    <Box
                      sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Nº de Parcelas
                      </Typography>
                      <Typography variant="h6" fontWeight="semibold">
                        {installment.paidInstallments}/
                        {installment.totalInstallments}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Modo de criação: campos editáveis */}
              {!isEditMode && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="totalAmount"
                      control={form.control}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          label={
                            isRecurring ? "Valor da Parcela" : "Valor Total"
                          }
                          placeholder="0.00"
                          type="text"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                R$
                              </InputAdornment>
                            ),
                          }}
                          error={!!error}
                          helperText={error?.message}
                          fullWidth
                          required
                          size={isMobile ? "small" : "medium"}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="totalInstallments"
                      control={form.control}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          label="Número de Parcelas"
                          placeholder={isRecurring ? "N/A" : "12"}
                          type="text"
                          disabled={isRecurring}
                          error={!!error}
                          helperText={error?.message}
                          fullWidth
                          required={!isRecurring}
                          size={isMobile ? "small" : "medium"}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* Manual Values Section - Only show when not recurring and has installments */}
              {!isRecurring &&
                totalInstallments > 0 &&
                totalInstallments <= 24 && (
                  <Grid size={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: 1,
                        borderColor: isManualValues
                          ? "primary.main"
                          : "divider",
                        bgcolor: isManualValues
                          ? alpha(theme.palette.primary.main, 0.05)
                          : "transparent",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isManualValues}
                            onChange={(e) =>
                              setIsManualValues(e.target.checked)
                            }
                            size={isMobile ? "small" : "medium"}
                          />
                        }
                        label={
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Settings2
                                style={{
                                  width: "0.875rem",
                                  height: "0.875rem",
                                }}
                              />
                              <Typography variant="body2" fontWeight="medium">
                                Valores Manuais por Parcela
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Distribua o valor total como preferir
                            </Typography>
                          </Box>
                        }
                      />

                      <Collapse in={isManualValues}>
                        <Box sx={{ mt: 2 }}>
                          {/* Validation Alert */}
                          {!isCustomAmountsValid &&
                            customAmounts.length > 0 && (
                              <Alert severity="warning" sx={{ mb: 2 }}>
                                A soma das parcelas (R${" "}
                                {customAmountsSum.toFixed(2)}) deve ser igual ao
                                valor total (R$ {totalAmount.toFixed(2)}).
                                Diferença: R$ {customAmountsDiff.toFixed(2)}
                              </Alert>
                            )}
                          {isCustomAmountsValid && customAmounts.length > 0 && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                              ✓ Valores distribuídos corretamente!
                            </Alert>
                          )}

                          {/* Installment Amount Inputs */}
                          <Grid container spacing={1}>
                            {customAmounts.map((amount, index) => (
                              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                                <TextField
                                  label={`Parcela ${index + 1}`}
                                  type="text"
                                  value={parseFloat(amount.toFixed(2))}
                                  onChange={(e) => {
                                    const newAmounts = [...customAmounts];
                                    newAmounts[index] =
                                      Number(e.target.value) || 0;
                                    setCustomAmounts(newAmounts);
                                  }}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        R$
                                      </InputAdornment>
                                    ),
                                  }}
                                  size="small"
                                  fullWidth
                                  inputProps={{ step: "0.01", min: "0" }}
                                />
                              </Grid>
                            ))}
                          </Grid>

                          {/* Quick Actions */}
                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                const equalValue = parseFloat(
                                  (totalAmount / totalInstallments).toFixed(2)
                                );
                                setCustomAmounts(
                                  Array(totalInstallments).fill(equalValue)
                                );
                              }}
                            >
                              Dividir Igualmente
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  </Grid>
                )}

              {/* Campos para parcelamentos recorrentes - apenas no modo de criação */}
              {!isEditMode && (
                <Grid size={12}>
                  <Controller
                    name="isRecurring"
                    control={form.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={field.onChange}
                            size={isMobile ? "small" : "medium"}
                          />
                        }
                        label={
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Repeat
                                style={{
                                  width: "0.875rem",
                                  height: "0.875rem",
                                }}
                              />
                              <Typography variant="body2" fontWeight="medium">
                                Parcelamento Recorrente
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Aluguel, contas fixas, etc.
                            </Typography>
                          </Box>
                        }
                      />
                    )}
                  />

                  {isRecurring && (
                    <Grid
                      container
                      spacing={{ xs: 1.5, md: 2 }}
                      sx={{
                        mt: 1,
                        pl: { xs: 2, md: 4 },
                        borderLeft: 2,
                        borderColor: "divider",
                      }}
                    >
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="recurringType"
                          control={form.control}
                          render={({ field, fieldState: { error } }) => (
                            <FormControl
                              fullWidth
                              error={!!error}
                              required
                              size={isMobile ? "small" : "medium"}
                            >
                              <InputLabel>Tipo de Recorrência</InputLabel>
                              <Select
                                {...field}
                                label="Tipo de Recorrência"
                                value={field.value || ""}
                                MenuProps={{ sx: { zIndex: 1400 } }}
                              >
                                <MenuItem value="monthly">Mensal</MenuItem>
                                <MenuItem value="yearly">Anual</MenuItem>
                              </Select>
                              <FormHelperText>{error?.message}</FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="endDate"
                          control={form.control}
                          render={({ field, fieldState: { error } }) => (
                            <TextField
                              type="date"
                              label="Data de Fim (Opcional)"
                              value={
                                field.value
                                  ? format(field.value, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={(e) => {
                                const date = e.target.value
                                  ? new Date(e.target.value)
                                  : undefined;
                                if (date) {
                                  date.setMinutes(
                                    date.getMinutes() + date.getTimezoneOffset()
                                  );
                                }
                                field.onChange(date);
                              }}
                              InputLabelProps={{ shrink: true }}
                              error={!!error}
                              helperText={error?.message}
                              fullWidth
                              size={isMobile ? "small" : "medium"}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Calculated installment amount - apenas no modo de criação */}
              {!isEditMode && totalAmount > 0 && (
                <Grid size={12}>
                  <Box
                    sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}
                  >
                    {isRecurring ? (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          Valor recorrente:
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight="semibold"
                          color="primary.main"
                        >
                          R$ {totalAmount.toFixed(2)}
                        </Typography>
                      </>
                    ) : installmentAmount > 0 ? (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          Valor de cada parcela:
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight="semibold"
                          color="primary.main"
                        >
                          R$ {installmentAmount.toFixed(2)}
                        </Typography>
                      </>
                    ) : null}
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl
                      fullWidth
                      error={!!error}
                      size={isMobile ? "small" : "medium"}
                    >
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        {...field}
                        label="Categoria"
                        value={field.value || ""}
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{error?.message}</FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="subcategory"
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl
                      fullWidth
                      error={!!error}
                      size={isMobile ? "small" : "medium"}
                    >
                      <InputLabel>Subcategoria (Opcional)</InputLabel>
                      <Select
                        {...field}
                        label="Subcategoria (Opcional)"
                        value={field.value || ""}
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        {(subcategories as any)[selectedCategory]?.map(
                          (sub: string) => (
                            <MenuItem key={sub} value={sub}>
                              {sub}
                            </MenuItem>
                          )
                        ) || []}
                      </Select>
                      <FormHelperText>{error?.message}</FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="establishment"
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Estabelecimento (Opcional)"
                      placeholder="Ex: Loja ABC..."
                      error={!!error}
                      helperText={error?.message}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </Grid>

              {/* Data de início - apenas no modo de criação */}
              {!isEditMode && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="startDate"
                    control={form.control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        type="date"
                        label="Data da Primeira Parcela"
                        value={
                          field.value ? format(field.value, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : undefined;
                          if (date) {
                            date.setMinutes(
                              date.getMinutes() + date.getTimezoneOffset()
                            );
                          }
                          field.onChange(date);
                        }}
                        InputLabelProps={{ shrink: true }}
                        error={!!error}
                        helperText={error?.message}
                        fullWidth
                        required
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>
              )}

              <Grid size={12}>
                <Controller
                  name="sourceWalletId"
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl
                      fullWidth
                      error={!!error}
                      size={isMobile ? "small" : "medium"}
                    >
                      <InputLabel>Carteira de Pagamento</InputLabel>
                      <Select
                        {...field}
                        label="Carteira de Pagamento"
                        value={field.value || ""}
                        MenuProps={{ sx: { zIndex: 1400 } }}
                      >
                        {wallets.map((wallet) => (
                          <MenuItem key={wallet.id} value={wallet.id}>
                            {wallet.name} ({wallet.type})
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{error?.message}</FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Optional: Contact PIX for payment - só mostra se Open Finance habilitado */}
              {isOpenFinanceEnabled && (
                <>
                  <Grid size={12}>
                    <Divider sx={{ my: 1 }}>
                      <Chip
                        icon={<PixIcon />}
                        label="Contato PIX (Opcional)"
                        size="small"
                        variant="outlined"
                      />
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Contato de Pagamento</InputLabel>
                      <Select
                        value={selectedContactId}
                        label="Contato de Pagamento"
                        onChange={(e) => {
                          setSelectedContactId(e.target.value);
                        }}
                        MenuProps={{ sx: { zIndex: 1400 } }}
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
                  </Grid>

                  {selectedContactId && availablePixKeys.length > 0 && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl
                        fullWidth
                        size={isMobile ? "small" : "medium"}
                      >
                        <InputLabel>Chave PIX</InputLabel>
                        <Select
                          value={selectedPixKeyId}
                          label="Chave PIX"
                          onChange={(e) => {
                            const newValue = e.target.value as string;
                            setSelectedPixKeyId(newValue);
                            setUserSelectedPixKey(true); // Mark as manually selected
                          }}
                          MenuProps={{ sx: { zIndex: 1400 } }}
                          renderValue={(selected) => {
                            const key = availablePixKeys.find(
                              (k) => k.id === selected
                            );
                            if (!key) return "";
                            return `${key.pixKeyType.toUpperCase()}: ${
                              key.pixKey
                            }${key.isDefault ? " (Padrão)" : ""}`;
                          }}
                        >
                          {availablePixKeys.map((key) => (
                            <MenuItem key={key.id} value={key.id}>
                              {key.label ? `${key.label} - ` : ""}
                              {key.pixKeyType.toUpperCase()}: {key.pixKey}
                              {key.isDefault ? " (Padrão)" : ""}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, md: 3 }, pt: { xs: 1.5, md: 2 } }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          variant="outlined"
          size={isMobile ? "small" : "medium"}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="create-installment-form"
          disabled={isSubmitting}
          variant="contained"
          size={isMobile ? "small" : "medium"}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : isEditMode ? (
              <Edit3 size={16} />
            ) : (
              <Plus size={16} />
            )
          }
        >
          {isEditMode ? "Salvar Alterações" : "Criar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
