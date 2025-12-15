// src/app/(auth)/reset-password/[token]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  alpha,
  useTheme,
  Link as MuiLink,
} from "@mui/material";
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { AuthLayoutWrapper } from "../../auth-layout-wrapper";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Loading state
  if (isValidating) {
    return (
      <AuthLayoutWrapper>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={48} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Validando link...
          </Typography>
        </Box>
      </AuthLayoutWrapper>
    );
  }

  // Invalid token state
  if (!isValid && !isSuccess) {
    return (
      <AuthLayoutWrapper>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.error.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ErrorIcon sx={{ fontSize: 40, color: "error.main" }} />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Link Inválido
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {error || "Este link de redefinição é inválido ou expirou."}
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="contained"
            sx={{
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Voltar ao Login
          </Button>
        </Box>
      </AuthLayoutWrapper>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayoutWrapper>
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.success.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle sx={{ fontSize: 40, color: "success.main" }} />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Senha Redefinida!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sua senha foi atualizada com sucesso. Você será redirecionado para o login...
          </Typography>
          <CircularProgress size={24} />
        </Box>
      </AuthLayoutWrapper>
    );
  }

  // Form state
  return (
    <AuthLayoutWrapper
      title="Nova Senha"
      subtitle="Digite sua nova senha abaixo"
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <TextField
            label="Nova Senha"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            disabled={isLoading}
            placeholder="Mínimo 8 caracteres"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: 20 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Confirmar Senha"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            required
            disabled={isLoading}
            placeholder="Digite a senha novamente"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? (
                      <VisibilityOff sx={{ fontSize: 20 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            fullWidth
            sx={{
              py: 1.5,
              mt: 1,
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              "&:hover": {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Redefinir Senha"}
          </Button>
        </Stack>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <MuiLink
            component={Link}
            href="/login"
            underline="hover"
            sx={{
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            ← Voltar ao Login
          </MuiLink>
        </Box>
      </Box>
    </AuthLayoutWrapper>
  );
}
