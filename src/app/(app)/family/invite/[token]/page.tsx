// src/app/(app)/family/invite/[token]/page.tsx

/**
 * Página de aceitar convite para família via link
 *
 * Quando o usuário clica no link do email, ele é direcionado para cá
 * onde pode aceitar ou recusar o convite.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  alpha,
} from "@mui/material";
import { Users, UserPlus, X, Check, Heart, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FamilyInvite } from "@/lib/family-types";
import { useToast } from "@/hooks/use-toast";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [invite, setInvite] = useState<FamilyInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const token = params.token as string;

  // Carregar dados do convite
  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setError("Token de convite inválido");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/family/invites/token/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Convite não encontrado ou expirado");
          setIsLoading(false);
          return;
        }

        setInvite(data.invite);
      } catch (err) {
        console.error("Erro ao carregar convite:", err);
        setError("Erro ao carregar informações do convite");
      } finally {
        setIsLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!user || !invite) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/family/invites/${invite.id}?userId=${user.uid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao aceitar convite",
          description: data.error,
          variant: "error",
        });
        return;
      }

      setAccepted(true);
      toast({
        title: "Bem-vindo à família!",
        description: `Você agora faz parte de "${invite.familyName}"`,
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/family");
      }, 2000);
    } catch (err) {
      console.error("Erro ao aceitar convite:", err);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o convite",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!user || !invite) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/family/invites/${invite.id}?userId=${user.uid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "decline" }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "Erro ao recusar convite",
          description: data.error,
          variant: "error",
        });
        return;
      }

      toast({ title: "Convite recusado" });
      router.push("/dashboard");
    } catch (err) {
      console.error("Erro ao recusar convite:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading
  if (isLoading || authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Erro
  if (error) {
    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 8, px: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <AlertCircle size={40} color="#ef4444" />
            </Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Convite Inválido
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/dashboard")}
            >
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Usuário não logado
  if (!user) {
    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 8, px: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <Users size={40} />
            </Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Entre para continuar
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Você precisa estar logado para aceitar este convite.
            </Typography>
            <Button
              variant="contained"
              onClick={() =>
                router.push(`/login?redirect=/family/invite/${token}`)
              }
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Sucesso ao aceitar
  if (accepted) {
    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 8, px: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <Heart size={40} color="#10b981" />
            </Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Bem-vindo à família! 🎉
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Você agora faz parte de &quot;{invite?.familyName}&quot;.
              Redirecionando...
            </Typography>
            <CircularProgress size={24} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Exibir convite
  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 8, px: 2 }}>
      <Card>
        <CardContent sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <UserPlus size={40} color="white" />
            </Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Convite para Família
            </Typography>
          </Box>

          {/* Conteúdo do convite */}
          <Box
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              p: 3,
              mb: 4,
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 48,
                    height: 48,
                  }}
                >
                  {invite?.invitedByName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Convite de
                  </Typography>
                  <Typography fontWeight={600}>
                    {invite?.invitedByName}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Para a família
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {invite?.familyName}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Você entrará como:
                </Typography>
                <Chip
                  size="small"
                  label={invite?.role === "admin" ? "Administrador" : "Membro"}
                  color={invite?.role === "admin" ? "primary" : "default"}
                />
              </Box>

              {invite?.message && (
                <Box
                  sx={{
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    p: 2,
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    &quot;{invite.message}&quot;
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Verificar email */}
          {invite &&
            user.email?.toLowerCase() !== invite.email.toLowerCase() && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Este convite foi enviado para <strong>{invite.email}</strong>.
                Você está logado como <strong>{user.email}</strong>.
              </Alert>
            )}

          {/* Ações */}
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={handleDecline}
              disabled={isProcessing}
              startIcon={<X size={18} />}
            >
              Recusar
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAccept}
              disabled={isProcessing}
              startIcon={
                isProcessing ? (
                  <CircularProgress size={18} />
                ) : (
                  <Check size={18} />
                )
              }
            >
              {isProcessing ? "Processando..." : "Aceitar Convite"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Info adicional */}
      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Ao aceitar, você poderá compartilhar carteiras, transações e muito
          mais com os membros da família.
        </Typography>
      </Box>
    </Box>
  );
}
