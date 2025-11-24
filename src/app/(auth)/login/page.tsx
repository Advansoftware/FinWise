'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Button, 
  Typography, 
  TextField, 
  Card, 
  CardContent, 
  CardHeader, 
  Box, 
  Stack, 
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/mui-wrappers/form';
import {useAuth} from '@/hooks/use-auth';
import {useToast} from '@/hooks/use-toast';
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
    <Card sx={{ 
      width: '100%', 
      maxWidth: 400, 
      mx: 'auto',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: 8,
        transform: 'translateY(-2px)'
      }
    }}>
      <CardHeader 
        sx={{ textAlign: 'center', pb: 0 }}
        title={
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48 }}>
                <Logo />
            </Box>
            <Typography variant="h5" fontWeight="bold">Bem-vindo de volta!</Typography>
          </Box>
        }
        subheader={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Faça login para acessar seu painel financeiro.
          </Typography>
        }
      />
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
            <Stack spacing={2}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <TextField 
                        placeholder="seu@email.com" 
                        fullWidth 
                        autoComplete="email"
                        {...field} 
                      />
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
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <FormLabel>Senha</FormLabel>
                      <ResetPasswordDialog>
                          <MuiLink 
                            component="button" 
                            type="button" 
                            variant="caption" 
                            underline="hover"
                            sx={{ fontWeight: 500 }}
                          >
                              Esqueceu sua senha?
                          </MuiLink>
                      </ResetPasswordDialog>
                    </Stack>
                    <FormControl>
                      <TextField 
                        type="password" 
                        placeholder="••••••••" 
                        fullWidth 
                        autoComplete="current-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                size="large"
                disabled={isLoading}
                sx={{ mt: 2 }}
              >
                {isLoading && <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />}
                Entrar
              </Button>
            </Stack>
        </Form>
        
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
          Não tem uma conta?{' '}
          <MuiLink 
            component={Link} 
            href="/signup" 
            underline="hover" 
            fontWeight="bold"
            color="primary"
          >
            Cadastre-se
          </MuiLink>
        </Typography>
      </CardContent>
    </Card>
  );
}
