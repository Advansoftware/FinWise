// src/components/installments/create-installment-dialog.tsx

import { useState } from 'react';
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
import { Loader2, Plus } from 'lucide-react';
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
  totalInstallments: z.string().min(1, 'Número de parcelas é obrigatório').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 120,
    'Número de parcelas deve ser entre 1 e 120'
  ),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  establishment: z.string().optional(),
  startDate: z.date({ required_error: 'Data de início é obrigatória' }),
  sourceWalletId: z.string().min(1, 'Carteira de origem é obrigatória'),
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
    },
  });

  const selectedCategory = form.watch('category');
  const totalAmount = Number(form.watch('totalAmount') || 0);
  const totalInstallments = Number(form.watch('totalInstallments') || 0);
  const installmentAmount = totalInstallments > 0 ? totalAmount / totalInstallments : 0;

  const onSubmit = async (data: InstallmentForm) => {
    setIsSubmitting(true);
    try {
      const installment = await createInstallment({
        name: data.name,
        description: data.description || undefined,
        totalAmount: Number(data.totalAmount),
        totalInstallments: Number(data.totalInstallments),
        category: data.category,
        subcategory: data.subcategory || undefined,
        establishment: data.establishment || undefined,
        startDate: data.startDate.toISOString(),
        sourceWalletId: data.sourceWalletId,
      });
      
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
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="120"
                        placeholder="12"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calculated installment amount */}
              {installmentAmount > 0 && (
                <div className="md:col-span-2 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">Valor de cada parcela:</p>
                  <p className="text-lg font-semibold">
                    R$ {installmentAmount.toFixed(2)}
                  </p>
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
