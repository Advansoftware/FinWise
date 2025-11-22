'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button, Typography} from '@mui/material';
import {TextField} from '@mui/material';
import {Card, CardContent, CardHeader} from '@mui/material';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/mui-wrappers/form';
import {useAuth} from '@/hooks/use-auth';
import {useToast} from '@/hooks/use-toast';
import {Loader2} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Logo} from '@/components/logo';
import {ResetPasswordDialog} from '../reset-password-dialog';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando para o dashboard...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "error",
        title: 'Erro de Login',
        description: error.message || 'Email ou senha inválidos.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12">
            <Logo />
        </div>
        <Typography variant="h6">Bem-vindo de volta!</Typography>
        <Typography variant="body2" color="text.secondary">Faça login para acessar seu painel financeiro.</Typography>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <TextField placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Senha</FormLabel>
                    <ResetPasswordDialog>
                        <button type="button" className="text-sm font-medium text-primary hover:underline focus:outline-none">
                            Esqueceu sua senha?
                        </button>
                    </ResetPasswordDialog>
                  </div>
                  <FormControl>
                    <TextField type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
