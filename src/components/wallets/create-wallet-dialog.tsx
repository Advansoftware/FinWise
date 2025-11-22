// src/components/wallets/create-wallet-dialog.tsx
'use client';

import { useEffect } from "react";
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
  FormLabel,
  FormHelperText,
  Stack,
  Box,
  Typography,
  CircularProgress
} from "@mui/material";
import { useToast } from "@/hooks/use-toast";
import { useWallets } from "@/hooks/use-wallets";
import { Wallet, WalletType } from "@/lib/types";

const walletSchema = z.object({
  name: z.string().min(1, "O nome da carteira é obrigatório."),
  type: z.enum(['Conta Corrente', 'Cartão de Crédito', 'Poupança', 'Investimentos', 'Dinheiro', 'Outros'], {
      required_error: "O tipo de carteira é obrigatório"
  }),
});

type WalletFormValues = z.infer<typeof walletSchema>;

const walletTypes: WalletType[] = ['Conta Corrente', 'Cartão de Crédito', 'Poupança', 'Investimentos', 'Dinheiro', 'Outros'];

interface CreateWalletDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: Wallet;
}

export function CreateWalletDialog({ open, onClose, initialData }: CreateWalletDialogProps) {
  const { toast } = useToast();
  const { addWallet, updateWallet } = useWallets();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      type: "Conta Corrente",
    },
  });

  useEffect(() => {
    if (open) {
        if (initialData) {
            reset({
                name: initialData.name,
                type: initialData.type,
            });
        } else {
            reset({ name: "", type: "Conta Corrente" });
        }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: WalletFormValues) => {
    try {
      if (initialData) {
        await updateWallet(initialData.id, data);
      } else {
        await addWallet(data);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save wallet:", error);
      toast({ variant: "error", title: "Erro ao salvar carteira." });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? "Editar Carteira" : "Criar Nova Carteira"}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Adicione uma nova conta, cartão ou outra fonte de recursos.
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)} id="wallet-form">
          <Stack spacing={3}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.name}>
                  <FormLabel>Nome da Carteira</FormLabel>
                  <TextField
                    {...field}
                    placeholder="Ex: Conta Principal"
                    error={!!errors.name}
                    fullWidth
                  />
                  {errors.name && <FormHelperText>{errors.name.message}</FormHelperText>}
                </FormControl>
              )}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.type}>
                  <FormLabel>Tipo de Carteira</FormLabel>
                  <Select {...field} fullWidth>
                    {walletTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                  {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Stack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          type="submit" 
          form="wallet-form"
          variant="contained" 
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {initialData ? "Salvar Alterações" : "Criar Carteira"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
