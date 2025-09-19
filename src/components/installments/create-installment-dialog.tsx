// src/components/installments/create-installment-dialog.tsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Repeat, Clock } from 'lucide-react';
import { useInstallments } from '@/hooks/use-installments';
import { useWallets } from '@/hooks/use-wallets';
import { useTransactions } from '@/hooks/use-transactions';
import { SingleDatePicker } from '@/components/single-date-picker';

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
  onOpenChange: (open: boolean) => void;
}

export function CreateInstallmentDialog({ open, onOpenChange }: CreateInstallmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInstallment } = useInstallments();
  const { wallets } = useWallets();
  const { categories, subcategories } = useTransactions();

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
        onOpenChange(false);
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[95vw] h-[95vh] sm:h-auto max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Novo Parcelamento</DialogTitle>
          <DialogDescription>
            Crie um novo parcelamento para acompanhar suas prestações e pagamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome do Parcelamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Notebook Dell, Sofá da Loja X..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre o parcelamento..."
                        className="resize-none"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isRecurring ? 'Valor da Parcela Recorrente (R$)' : 'Valor Total (R$)'}
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    {isRecurring && (
                      <p className="text-xs text-muted-foreground">
                        Este valor será cobrado a cada período de recorrência
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Número de Parcelas
                      {!isRecurring && <span className="text-red-500 ml-1">*</span>}
                      {isRecurring && <span className="text-muted-foreground ml-1">(opcional)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="120"
                        placeholder={isRecurring ? "Não aplicável para recorrentes" : "12"}
                        disabled={isRecurring}
                        {...field} 
                      />
                    </FormControl>
                    {isRecurring && (
                      <p className="text-xs text-muted-foreground">
                        Para parcelamentos recorrentes, não há limite de parcelas
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos para parcelamentos recorrentes */}
              <div className="md:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          Parcelamento Recorrente
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Para pagamentos como aluguel, contas fixas, etc. que não têm fim definido.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recurringType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Tipo de Recorrência
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Data de Fim (Opcional)
                          </FormLabel>
                          <FormControl>
                            <SingleDatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Deixe vazio se não há data de fim prevista
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Calculated installment amount */}
              {totalAmount > 0 && (
                <div className="md:col-span-2 p-3 bg-muted rounded-md">
                  {isRecurring ? (
                    <>
                      <p className="text-sm text-muted-foreground">Valor de cada parcela recorrente:</p>
                      <p className="text-lg font-semibold">
                        R$ {totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Este valor será cobrado de forma recorrente
                      </p>
                    </>
                  ) : installmentAmount > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">Valor de cada parcela:</p>
                      <p className="text-lg font-semibold">
                        R$ {installmentAmount.toFixed(2)}
                      </p>
                    </>
                  ) : null}
                </div>
              )}

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a subcategoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(subcategories as any)[selectedCategory]?.map((sub: string) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="establishment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estabelecimento (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Loja ABC, Magazine Luiza..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Primeira Parcela</FormLabel>
                    <FormControl>
                      <SingleDatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceWalletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carteira de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a carteira" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name} ({wallet.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full sm:w-auto"
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Criar Parcelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
