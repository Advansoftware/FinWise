'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'A senha atual é obrigatória.' }),
  newPassword: z.string().min(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As novas senhas não coincidem.',
  path: ['confirmPassword'],
});

export default function ProfilePage() {
  const { user, updateUserProfile, reauthenticate, updateUserPassword } = useAuth();
  const { toast } = useToast();
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: { // Use `values` to keep form in sync with user state
      name: user?.displayName || '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    setIsProfileSaving(true);
    try {
      await updateUserProfile(values.name);
      toast({ title: 'Sucesso!', description: 'Seu nome foi atualizado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar seu nome.' });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    setIsPasswordSaving(true);
    try {
      await reauthenticate(values.currentPassword);
      await updateUserPassword(values.newPassword);
      toast({ title: 'Sucesso!', description: 'Sua senha foi alterada.' });
      passwordForm.reset();
    } catch (error: any) {
      const description = error.code === 'auth/wrong-password' 
        ? 'A senha atual está incorreta.'
        : 'Não foi possível alterar sua senha.';
      toast({ variant: 'destructive', title: 'Erro', description });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  if (!user) {
    return null; // ou um esqueleto de carregamento
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e de segurança.</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seu nome de exibição.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                <Input id="name" {...profileForm.register('name')} />
                <p className="text-sm text-destructive">{profileForm.formState.errors.name?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email || ''} disabled />
              </div>
              <Button type="submit" disabled={isProfileSaving}>
                {isProfileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Para sua segurança, recomendamos usar uma senha forte.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                 <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword?.message}</p>
              </div>
               <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                 <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword?.message}</p>
              </div>
               <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                 <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword?.message}</p>
              </div>
              <Button type="submit" disabled={isPasswordSaving}>
                 {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
