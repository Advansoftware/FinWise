// src/components/goals/add-deposit-dialog.tsx
"use client";

import { useState, useEffect, cloneElement, isValidElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useToast } from "@/hooks/use-toast";
import { useGoals } from "@/hooks/use-goals";
import { Goal } from "@/lib/types";
import { useWallets } from "@/hooks/use-wallets";

const depositSchema = z.object({
  amount: z.coerce
    .number()
    .positive("O valor do depósito deve ser maior que zero."),
  walletId: z.string().min(1, "A carteira de origem é obrigatória."),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface AddDepositDialogProps {
  goal: Goal;
  children?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}

export function AddDepositDialog({
  goal,
  children,
  open: controlledOpen,
  onClose: controlledOnClose,
}: AddDepositDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addDeposit } = useGoals();
  const { wallets } = useWallets();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpen = () => {
    if (!isControlled) setInternalOpen(true);
  };

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: 0, walletId: "" },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: DepositFormValues) => {
    setIsSubmitting(true);
    try {
      await addDeposit(goal.id, Number(data.amount), data.walletId);
      toast({ title: "Depósito realizado com sucesso!" });
      handleClose();
    } catch (error) {
      console.error("Failed to add deposit:", error);
      toast({ variant: "error", title: "Erro ao adicionar depósito." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const trigger =
    children &&
    (isValidElement(children) ? (
      cloneElement(children as any, { onClick: handleOpen })
    ) : (
      <div onClick={handleOpen}>{children}</div>
    ));

  return (
    <>
      {trigger}
      <Dialog open={!!open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Adicionar Depósito para "{goal.name}"</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Insira o valor que você deseja adicionar a esta meta e de qual
            carteira o dinheiro sairá.
          </DialogContentText>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Valor do Depósito (R$)"
                  type="number"
                  placeholder="Ex: 100.00"
                  fullWidth
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                  inputProps={{ step: "0.01" }}
                />
              )}
            />

            <Controller
              name="walletId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Carteira de Origem"
                  fullWidth
                  placeholder="Selecione de onde sairá o dinheiro"
                  error={!!errors.walletId}
                  helperText={errors.walletId?.message}
                  value={field.value || ""}
                >
                  {wallets.map((wallet) => (
                    <MenuItem key={wallet.id} value={wallet.id}>
                      {wallet.name} (R$ {(wallet.balance || 0).toFixed(2)})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
              >
                Adicionar
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
