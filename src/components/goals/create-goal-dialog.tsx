// src/components/goals/create-goal-dialog.tsx
'use client';

import { useEffect, useState } from "react";
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
  Typography,
  Stack
} from "@mui/material";
import { useToast } from "@/hooks/use-toast";
import { useGoals } from "@/hooks/use-goals";
import { Goal } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { SingleDatePicker } from "../single-date-picker";

const goalSchema = z.object({
  name: z.string().min(1, "O nome da meta é obrigatório."),
  targetAmount: z.coerce.number().positive("O valor alvo deve ser maior que zero."),
  monthlyDeposit: z.coerce.number().optional(),
  targetDate: z.date().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: Goal;
}

export function CreateGoalDialog({ open, onClose, initialData }: CreateGoalDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addGoal, updateGoal } = useGoals();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      monthlyDeposit: undefined,
      targetDate: undefined,
    },
  });

  useEffect(() => {
    if (open) {
        if (initialData) {
            reset({
                name: initialData.name,
                targetAmount: initialData.targetAmount,
                monthlyDeposit: initialData.monthlyDeposit || undefined,
                targetDate: initialData.targetDate ? new Date(initialData.targetDate) : undefined
            });
        } else {
            reset({ name: "", targetAmount: 0, monthlyDeposit: undefined, targetDate: undefined });
        }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: GoalFormValues) => {
    setIsSubmitting(true);
    try {
      const goalData: Partial<Goal> = {
        name: data.name,
        targetAmount: Number(data.targetAmount),
        monthlyDeposit: data.monthlyDeposit ? Number(data.monthlyDeposit) : undefined,
        targetDate: data.targetDate ? data.targetDate.toISOString() : undefined,
      };

      if (initialData) {
        await updateGoal(initialData.id, goalData);
        toast({ title: "Meta atualizada com sucesso!" });
      } else {
        await addGoal(goalData as Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>);
        toast({ title: "Meta criada com sucesso!" });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save goal:", error);
      toast({ variant: "destructive", title: "Erro ao salvar meta." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? "Editar Meta" : "Criar Nova Meta"}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
            Defina um objetivo financeiro. Preencha os campos opcionais para ajudar a IA a fazer projeções mais precisas.
        </DialogContentText>
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
                name="name"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Nome da Meta"
                        placeholder="Ex: Comprar um Carro"
                        fullWidth
                        size="small"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />
                )}
            />

            <Controller
                name="targetAmount"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Valor da Meta (R$)"
                        type="number"
                        placeholder="Ex: 30000.00"
                        fullWidth
                        size="small"
                        error={!!errors.targetAmount}
                        helperText={errors.targetAmount?.message}
                        inputProps={{ step: "0.01" }}
                    />
                )}
            />
            
            <Box position="relative" py={2}>
                <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', bgcolor: 'background.paper', px: 1 }}>
                    Opcional
                </Typography>
                <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
            </Box>

            <Controller
                name="monthlyDeposit"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Depósito Mensal Planejado (R$)"
                        type="number"
                        placeholder="Ex: 500.00"
                        fullWidth
                        size="small"
                        error={!!errors.monthlyDeposit}
                        helperText={errors.monthlyDeposit?.message}
                        inputProps={{ step: "0.01" }}
                        value={field.value || ''}
                    />
                )}
            />

            <Controller
                name="targetDate"
                control={control}
                render={({ field }) => (
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Data Alvo para Conclusão</Typography>
                        <SingleDatePicker date={field.value} setDate={field.onChange} />
                        {errors.targetDate && <Typography variant="caption" color="error">{errors.targetDate.message}</Typography>}
                    </Box>
                )}
            />

            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar Alterações" : "Criar Meta"}
              </Button>
            </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
