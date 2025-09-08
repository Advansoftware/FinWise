// src/components/installments/edit-installment-dialog.tsx

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit3 } from 'lucide-react';
import { Installment } from '@/core/ports/installments.port';
import { useInstallments } from '@/hooks/use-installments';
import { useWallets } from '@/hooks/use-wallets';

const editInstallmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  establishment: z.string().optional(),
  sourceWalletId: z.string().optional(),
});

type EditInstallmentForm = z.infer<typeof editInstallmentSchema>;

interface EditInstallmentDialogProps {
  installment: Installment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Roupas',
  'Tecnologia',
  'Serviços',
  'Outros'
];

export function EditInstallmentDialog({ 
  installment, 
  open, 
  onOpenChange 
}: EditInstallmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateInstallment } = useInstallments();
  const { wallets } = useWallets();

  const form = useForm<EditInstallmentForm>({
    resolver: zodResolver(editInstallmentSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      subcategory: '',
      establishment: '',
      sourceWalletId: 'none',
    },
  });

  // Reset form when installment changes
  useEffect(() => {
    if (installment && open) {
      form.reset({
        name: installment.name,
        description: installment.description || '',
        category: installment.category,
        subcategory: installment.subcategory || '',
        establishment: installment.establishment || '',
        sourceWalletId: installment.sourceWalletId || 'none',
      });
    }
  }, [installment, open, form]);

  const onSubmit = async (data: EditInstallmentForm) => {
    if (!installment) return;
    
    setIsSubmitting(true);
    try {
      const success = await updateInstallment(installment.id, {
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        establishment: data.establishment,
        sourceWalletId: data.sourceWalletId === 'none' ? undefined : data.sourceWalletId,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Editar Parcelamento
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do parcelamento {installment.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do parcelamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição adicional"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
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
                    <FormLabel>Subcategoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="establishment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estabelecimento (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Local da compra" {...field} />
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
                  <FormLabel>Carteira de Débito (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma carteira" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Edit3 className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
