// src/components/installments/create-installment-dialog.tsx

import {useState, useEffect} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Checkbox, FormControlLabel, Box, Typography, Stack, InputAdornment, IconButton, useTheme, alpha, CircularProgress} from '@mui/material';
import {Loader2, Plus, Repeat, Clock, Calendar as CalendarIcon, X} from 'lucide-react';
import {useInstallments} from '@/hooks/use-installments';
import {useWallets} from '@/hooks/use-wallets';
import {useTransactions} from '@/hooks/use-transactions';
import {format} from 'date-fns';

const installmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  totalAmount: z.string().min(1, 'Valor total é obrigatório').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Valor deve ser maior que zero'
  ),
  totalInstallments: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  establishment: z.string().optional(),
  startDate: z.date({ required_error: 'Data de início é obrigatória' }),
  sourceWalletId: z.string().min(1, 'Carteira de origem é obrigatória'),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(['monthly', 'yearly']).optional(),
  endDate: z.date().optional(),
}).superRefine((data, ctx) => {
  // Validações específicas para parcelamentos recorrentes
  if (data.isRecurring) {
    // Para recorrentes, recurringType é obrigatório
    if (!data.recurringType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tipo de recorrência é obrigatório para parcelamentos recorrentes",
        path: ["recurringType"]
      });
    }
  } else {
    // Para parcelamentos normais, totalInstallments é obrigatório e deve ser válido
    if (!data.totalInstallments || data.totalInstallments.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número de parcelas é obrigatório",
        path: ["totalInstallments"]
      });
    } else {
      const installments = Number(data.totalInstallments);
      if (isNaN(installments) || installments <= 0 || installments > 120) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Número de parcelas deve ser entre 1 e 120",
          path: ["totalInstallments"]
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

export function CreateInstallmentDialog({ open, onClose }: CreateInstallmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInstallment } = useInstallments();
  const { wallets } = useWallets();
  const { categories, subcategories } = useTransactions();
  const theme = useTheme();

  const form = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      name: '',
      description: '',
      totalAmount: '',
      totalInstallments: '',
      category: '',
      subcategory: '',
      establishment: '',
      sourceWalletId: '',
      isRecurring: false,
      recurringType: 'monthly',
      startDate: new Date(),
    },
  });

  const isRecurring = form.watch('isRecurring');
  const selectedCategory = form.watch('category');
  const totalAmount = Number(form.watch('totalAmount') || 0);
  const totalInstallments = Number(form.watch('totalInstallments') || 0);
  const installmentAmount = totalInstallments > 0 ? totalAmount / totalInstallments : 0;

  // Limpar campos específicos quando alternar entre recorrente e não recorrente
  useEffect(() => {
    if (isRecurring) {
      // Quando ativar recorrente, limpar o número de parcelas
      form.setValue('totalInstallments', '');
      // Garantir que o tipo de recorrência tenha um valor padrão
      if (!form.getValues('recurringType')) {
        form.setValue('recurringType', 'monthly');
      }
    } else {
      // Quando desativar recorrente, limpar data de fim e tipo de recorrência
      form.setValue('endDate', undefined);
      form.setValue('recurringType', undefined);
    }
  }, [isRecurring, form]);

  const onSubmit = async (data: InstallmentForm) => {
    setIsSubmitting(true);
    try {
      const installmentData = {
        name: data.name,
        description: data.description || undefined,
        totalAmount: Number(data.totalAmount),
        totalInstallments: data.isRecurring ? 999999 : Number(data.totalInstallments), // Valor alto para recorrentes
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
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          Novo Parcelamento
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 'normal' }}>
            Crie um novo parcelamento para acompanhar suas prestações e pagamentos.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X style={{ width: '1.25rem', height: '1.25rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <form onSubmit={form.handleSubmit(onSubmit)} id="create-installment-form">
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
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
                    sx={{ gridColumn: { md: 'span 2' } }}
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
                    placeholder="Informações adicionais sobre o parcelamento..."
                    multiline
                    rows={2}
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                    sx={{ gridColumn: { md: 'span 2' } }}
                  />
                )}
              />

              <Controller
                name="totalAmount"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label={isRecurring ? 'Valor da Parcela Recorrente' : 'Valor Total'}
                    placeholder="0.00"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    error={!!error}
                    helperText={error?.message || (isRecurring && "Este valor será cobrado a cada período de recorrência")}
                    fullWidth
                    required
                  />
                )}
              />

              <Controller
                name="totalInstallments"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Número de Parcelas"
                    placeholder={isRecurring ? "Não aplicável" : "12"}
                    type="number"
                    disabled={isRecurring}
                    error={!!error}
                    helperText={error?.message || (isRecurring && "Para parcelamentos recorrentes, não há limite de parcelas")}
                    fullWidth
                    required={!isRecurring}
                  />
                )}
              />

              {/* Campos para parcelamentos recorrentes */}
              <Box sx={{ gridColumn: { md: 'span 2' } }}>
                <Controller
                  name="isRecurring"
                  control={form.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Repeat style={{ width: '1rem', height: '1rem' }} />
                            <Typography variant="body2" fontWeight="medium">Parcelamento Recorrente</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Para pagamentos como aluguel, contas fixas, etc. que não têm fim definido.
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                />

                {isRecurring && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mt: 2, pl: 4, borderLeft: 2, borderColor: 'divider' }}>
                    <Controller
                      name="recurringType"
                      control={form.control}
                      render={({ field, fieldState: { error } }) => (
                        <FormControl fullWidth error={!!error} required>
                          <InputLabel>Tipo de Recorrência</InputLabel>
                          <Select
                            {...field}
                            label="Tipo de Recorrência"
                            value={field.value || ''}
                          >
                            <MenuItem value="monthly">Mensal</MenuItem>
                            <MenuItem value="yearly">Anual</MenuItem>
                          </Select>
                          <FormHelperText>{error?.message}</FormHelperText>
                        </FormControl>
                      )}
                    />

                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          type="date"
                          label="Data de Fim (Opcional)"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            // Ajustar fuso horário para evitar problemas de dia anterior
                            if (date) {
                              date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                            }
                            field.onChange(date);
                          }}
                          InputLabelProps={{ shrink: true }}
                          error={!!error}
                          helperText={error?.message || "Deixe vazio se não há data de fim prevista"}
                          fullWidth
                        />
                      )}
                    />
                  </Box>
                )}
              </Box>

              {/* Calculated installment amount */}
              {totalAmount > 0 && (
                <Box sx={{ gridColumn: { md: 'span 2' }, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  {isRecurring ? (
                    <>
                      <Typography variant="body2" color="text.secondary">Valor de cada parcela recorrente:</Typography>
                      <Typography variant="h6" fontWeight="semibold" color="primary.main">
                        R$ {totalAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Este valor será cobrado de forma recorrente
                      </Typography>
                    </>
                  ) : installmentAmount > 0 ? (
                    <>
                      <Typography variant="body2" color="text.secondary">Valor de cada parcela:</Typography>
                      <Typography variant="h6" fontWeight="semibold" color="primary.main">
                        R$ {installmentAmount.toFixed(2)}
                      </Typography>
                    </>
                  ) : null}
                </Box>
              )}

              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      {...field}
                      label="Categoria"
                      value={field.value || ''}
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

              <Controller
                name="subcategory"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Subcategoria (Opcional)</InputLabel>
                    <Select
                      {...field}
                      label="Subcategoria (Opcional)"
                      value={field.value || ''}
                    >
                      {(subcategories as any)[selectedCategory]?.map((sub: string) => (
                        <MenuItem key={sub} value={sub}>
                          {sub}
                        </MenuItem>
                      )) || []}
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
                  />
                )}
              />

              <Controller
                name="startDate"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    type="date"
                    label="Data da Primeira Parcela"
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      if (date) {
                        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                      }
                      field.onChange(date);
                    }}
                    InputLabelProps={{ shrink: true }}
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                    required
                  />
                )}
              />

              <Controller
                name="sourceWalletId"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>Carteira de Pagamento</InputLabel>
                    <Select
                      {...field}
                      label="Carteira de Pagamento"
                      value={field.value || ''}
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
            </Box>
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          form="create-installment-form"
          disabled={isSubmitting} 
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Plus />}
        >
          Criar Parcelamento
        </Button>
      </DialogActions>
    </Dialog>
  );
}
