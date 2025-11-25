// src/components/installments/create-installment-dialog.tsx

import { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  Loader2,
  Plus,
  Repeat,
  Clock,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { useInstallments } from "@/hooks/use-installments";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { format } from "date-fns";

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
}

export function CreateInstallmentDialog({
  open,
  onClose,
}: CreateInstallmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInstallment } = useInstallments();
  const { wallets } = useWallets();
  const { categories, subcategories } = useTransactions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  const onSubmit = async (data: InstallmentForm) => {
    setIsSubmitting(true);
    try {
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
      };

      const installment = await createInstallment(installmentData);

      if (installment) {
        onClose();
        form.reset();
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
            Novo Parcelamento
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Crie um novo parcelamento para acompanhar suas prestações.
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

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="totalAmount"
                  control={form.control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label={isRecurring ? "Valor da Parcela" : "Valor Total"}
                      placeholder="0.00"
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">R$</InputAdornment>
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
                      type="number"
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

              {/* Campos para parcelamentos recorrentes */}
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
                              style={{ width: "0.875rem", height: "0.875rem" }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              Parcelamento Recorrente
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
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

              {/* Calculated installment amount */}
              {totalAmount > 0 && (
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
            ) : (
              <Plus size={16} />
            )
          }
        >
          Criar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
