// src/app/(auth)/reset-password/[token]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  alpha,
} from "@mui/material";
import { Lock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setIsValid(true);
        } else {
          setError(data.error || "Token inválido ou expirado");
        }
      } catch (err) {
        setError("Erro ao validar o link de redefinição");
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Erro ao redefinir a senha");
      }
    } catch (err) {
      setError("Erro ao processar a solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Validando link...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!isValid && !isSuccess) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 400, width: "100%", textAlign: "center", borderRadius: 3 }}>
          <XCircle size={64} color="#EF4444" style={{ marginBottom: 16 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Link Inválido
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error || "Este link de redefinição é inválido ou expirou."}
          </Typography>
          <Link href="/login" passHref>
            <Button variant="contained" startIcon={<ArrowLeft size={16} />}>
              Voltar ao Login
            </Button>
          </Link>
        </Paper>
      </Box>
    );
  }

  if (isSuccess) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 400, width: "100%", textAlign: "center", borderRadius: 3 }}>
          <CheckCircle2 size={64} color="#22C55E" style={{ marginBottom: 16 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Senha Redefinida!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Sua senha foi atualizada com sucesso. Você será redirecionado para o login...
          </Typography>
          <CircularProgress size={24} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                display: "inline-flex",
                p: 2,
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                mb: 2,
              }}
            >
              <Lock size={32} color="#9333EA" />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Nova Senha
            </Typography>
            <Typography color="text.secondary">
              Digite sua nova senha abaixo
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Nova Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                disabled={isLoading}
                placeholder="Mínimo 8 caracteres"
              />
              <TextField
                label="Confirmar Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                disabled={isLoading}
                placeholder="Digite a senha novamente"
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Redefinir Senha"
                )}
              </Button>
            </Stack>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Link href="/login" passHref>
              <Button variant="text" startIcon={<ArrowLeft size={16} />}>
                Voltar ao Login
              </Button>
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
