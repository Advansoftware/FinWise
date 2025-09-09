// src/components/installments/edit-installment-dialog.tsx

import { useState, useEffect, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit3 } from 'lucide-react';
import { Installment } from '@/core/ports/installments.port';
import { useInstallments } from '@/hooks/use-installments';
import { useWallets } from '@/hooks/use-wallets';
import { useTransactions } from '@/hooks/use-transactions';

const editInstallmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  establishment: z.string().optional(),
  sourceWalletId: z.string().min(1, 'A carteira de origem é obrigatória'),
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
  onOpenChange 
}: EditInstallmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateInstallment } = useInstallments();
  const { wallets } = useWallets();
  const { categories, subcategories } = useTransactions();

  const availableCategories = categories;
  
  const form = useForm<EditInstallmentForm>({
    resolver: zodResolver(editInstallmentSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      subcategory: '',
      establishment: '',
      sourceWalletId: '',
    },
  });

  const selectedCategory = form.watch('category');
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return subcategories[selectedCategory as keyof typeof subcategories] || [];
  }, [selectedCategory, subcategories]);

  // Reset form when installment changes
  useEffect(() => {
    if (installment && open) {
      form.reset({
        name: installment.name,
        description: installment.description || '',
        category: installment.category,
        subcategory: installment.subcategory || '',
        establishment: installment.establishment || '',
        sourceWalletId: installment.sourceWalletId || '',
      });
    }
  }, [installment, open, form]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory) {
      const currentSubcategory = form.getValues('subcategory');
      if (currentSubcategory && !availableSubcategories.includes(currentSubcategory)) {
        form.setValue('subcategory', '');
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
        updatedAt: new Date().toISOString(),
      });

      if (success) {
        onOpenChange(false);
        form.reset();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar parcelamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!installment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[95vw] h-[95vh] sm:h-auto max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Editar Parcelamento
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do parcelamento "{installment.name}"
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
                        <Input placeholder="Ex: Compra no Magazine Luiza" {...field} />
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
                          placeholder="Detalhes sobre o parcelamento..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                   <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installment.totalAmount)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Nº de Parcelas</p>
                    <p className="text-lg font-semibold">
                      {installment.paidInstallments}/{installment.totalInstallments}
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCategories.map((category) => (
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedCategory || availableSubcategories.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSubcategories.map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
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
                  name="establishment"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
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
                  name="sourceWalletId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Carteira de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
            type="button" 
            disabled={isSubmitting} 
            className="w-full sm:w-auto"
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Edit3 className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
