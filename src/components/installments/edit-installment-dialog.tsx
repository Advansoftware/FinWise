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
import { Box, Stack, Typography } from '@mui/material';

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

  // Function to get a valid wallet ID, fallback to first available if original doesn't exist
  const getValidWalletId = () => {
    if (installment?.sourceWalletId) {
      const walletExists = wallets.find(w => w.id === installment.sourceWalletId);
      if (walletExists) {
        return installment.sourceWalletId;
      }
    }
    return wallets.length > 0 ? wallets[0].id : '';
  };
  
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
        sourceWalletId: getValidWalletId(),
      });
    }
  }, [installment, open, form, wallets]);

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
      <DialogContent sx={{ maxWidth: { sm: '42rem' }, width: { xs: '95vw' }, height: { xs: '95vh', sm: 'auto' }, maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        <DialogHeader sx={{ flexShrink: 0 }}>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Edit3 style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Editar Parcelamento</span>
            </Stack>
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do parcelamento "{installment.name}"
          </DialogDescription>
        </DialogHeader>

        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem sx={{ gridColumn: { md: 'span 2' } }}>
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
                    <FormItem sx={{ gridColumn: { md: 'span 2' } }}>
                      <FormLabel>Descrição (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detalhes sobre o parcelamento..."
                          sx={{ resize: 'none' }}
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Box sx={{ gridColumn: { md: 'span 2' }, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                   <Box sx={{ p: 1.5, bgcolor: 'var(--muted)', borderRadius: '0.375rem' }}>
                    <Typography sx={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Valor Total</Typography>
                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installment.totalAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'var(--muted)', borderRadius: '0.375rem' }}>
                    <Typography sx={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Nº de Parcelas</Typography>
                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
                      {installment.paidInstallments}/{installment.totalInstallments}
                    </Typography>
                  </Box>
                </Box>

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
                    <FormItem sx={{ gridColumn: { md: 'span 2' } }}>
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
                    <FormItem sx={{ gridColumn: { md: 'span 2' } }}>
                      <FormLabel>Carteira de Origem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a carteira" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Box>
            </form>
          </Form>
        </Box>

        <DialogFooter sx={{ flexShrink: 0, pt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isSubmitting}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {isSubmitting && <Loader2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} className="animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
