"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, TextField, CircularProgress } from "@mui/material";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/mui-wrappers/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "A senha atual é obrigatória." }),
    newPassword: z
      .string()
      .min(6, { message: "A nova senha deve ter no mínimo 6 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export function UpdatePasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A alteração de senha será implementada em breve.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Erro ao alterar senha",
        description: "Não foi possível alterar sua senha. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name="currentPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Senha Atual</FormLabel>
            <FormControl>
              <TextField
                type="password"
                placeholder="Sua senha atual"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="newPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nova Senha</FormLabel>
            <FormControl>
              <TextField type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirmar Nova Senha</FormLabel>
            <FormControl>
              <TextField type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={isLoading} variant="contained">
        {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
        Atualizar Senha
      </Button>
    </Form>
  );
}
