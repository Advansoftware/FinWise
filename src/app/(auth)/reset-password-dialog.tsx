"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  IconButton,
  alpha,
} from "@mui/material";
import { Close as CloseIcon, Email as EmailIcon } from "@mui/icons-material";
import { useToast } from "@/hooks/use-toast";

interface ResetPasswordDialogProps {
  children: React.ReactNode;
}

export function ResetPasswordDialog({ children }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setEmail("");
      setIsSent(false);
      setIsSending(false);
    }, 200);
  };

  const handleReset = async () => {
    if (!email) {
      toast({
        variant: "error",
        title: "Email obrigatório",
        description: "Por favor, insira seu endereço de email.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "error",
        title: "Email inválido",
        description: "Por favor, insira um endereço de email válido.",
      });
      return;
    }

    setIsSending(true);
    try {
      // TODO: Implementar funcionalidade de reset de senha com Firebase ou API
      // await sendPasswordResetEmail(email);

      // Simular delay de rede
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setIsSent(true);
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Erro ao enviar email",
        description:
          error.message ||
          "Verifique se o email está correto e tente novamente.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSending && !isSent) {
      handleReset();
    }
  };

  return (
    <>
      {/* Trigger element */}
      <Box component="span" onClick={handleOpen} sx={{ cursor: "pointer" }}>
        {children}
      </Box>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmailIcon color="primary" />
            Redefinir Senha
          </Box>
          <IconButton
            aria-label="fechar"
            onClick={handleClose}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: isSent ? 0 : 3 }}>
            {isSent
              ? "Enviamos um link de redefinição para o seu email. Verifique sua caixa de entrada e a pasta de spam."
              : "Insira seu email e enviaremos um link para você redefinir sua senha."}
          </DialogContentText>

          {!isSent && (
            <TextField
              autoFocus
              id="reset-email"
              label="Email"
              type="email"
              fullWidth
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                },
              }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {isSent ? (
            <Button
              onClick={handleClose}
              variant="contained"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Fechar
            </Button>
          ) : (
            <>
              <Button
                onClick={handleClose}
                color="inherit"
                sx={{ borderRadius: 2 }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReset}
                variant="contained"
                disabled={isSending}
                sx={{
                  borderRadius: 2,
                  minWidth: 140,
                }}
              >
                {isSending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Enviar Link"
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
