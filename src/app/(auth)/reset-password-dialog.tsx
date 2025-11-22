// TODO: Migrar este componente para MUI Dialog API
'use client';

/*
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogActions } from "@mui/material";
import { Button } from "@mui/material";
import { TextField } from "@mui/material";
import { InputLabel } from "@mui/material";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ResetPasswordDialog({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email obrigatório",
        description: "Por favor, insira seu endereço de email.",
      });
      return;
    }
    setIsSending(true);
    try {
      // TODO: Implementar funcionalidade de reset de senha
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A recuperação de senha será implementada em breve.",
      });
      setIsSent(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: "Verifique se o email está correto e tente novamente.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsSent(false);
    setIsSending(false);
  }

  return (
    <Dialog onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
          <DialogDescription>
            {isSent
              ? "Verifique sua caixa de entrada (e a pasta de spam) para encontrar o link de redefinição de senha."
              : "Insira seu email e enviaremos um link para você redefinir sua senha."}
          </DialogDescription>
        </DialogHeader>
        {!isSent ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="col-span-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          {isSent ? (
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          ) : (
            <Button onClick={handleReset} disabled={isSending}>
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
*/

// Placeholder export
export function ResetPasswordDialog({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
