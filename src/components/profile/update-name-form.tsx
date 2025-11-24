"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, TextField, CircularProgress, Stack } from "@mui/material";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/mui-wrappers/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
});

export function UpdateNameForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await updateUser({ displayName: values.name });
      toast({
        title: "Sucesso!",
        description: "Seu nome foi atualizado.",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Erro",
        description: "Não foi possível atualizar seu nome.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Completo</FormLabel>
            <FormControl>
              <TextField placeholder="Seu nome" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={isLoading} variant="contained">
        {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
        Salvar Alterações
      </Button>
    </Form>
  );
}
