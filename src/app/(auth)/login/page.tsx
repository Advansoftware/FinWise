"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Typography,
  TextField,
  Box,
  Stack,
  Link as MuiLink,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  Fade,
  alpha,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { ResetPasswordDialog } from "../reset-password-dialog";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Erro de Login",
        description: error.message || "Email ou senha inválidos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Fade in timeout={600}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          borderRadius: 4,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            pt: { xs: 4, sm: 5 },
            pb: 3,
            px: { xs: 3, sm: 4 },
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: "auto",
              mb: 3,
              p: 1.5,
              borderRadius: 3,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Logo />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              mb: 1,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bem-vindo de volta!
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 280, mx: "auto" }}
          >
            Faça login para acessar seu painel financeiro inteligente
          </Typography>
        </Box>

        {/* Form Section */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 4, sm: 5 } }}
        >
          <Stack spacing={3}>
            {/* Email Field */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  placeholder="seu@email.com"
                  type="email"
                  fullWidth
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon
                          sx={{
                            color: errors.email
                              ? "error.main"
                              : "text.secondary",
                            fontSize: 20,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Password Field */}
            <Box>
              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 0.5 }}>
                <ResetPasswordDialog>
                  <MuiLink
                    component="button"
                    type="button"
                    variant="caption"
                    underline="hover"
                    sx={{
                      fontWeight: 500,
                      color: "primary.main",
                      cursor: "pointer",
                    }}
                  >
                    Esqueceu sua senha?
                  </MuiLink>
                </ResetPasswordDialog>
              </Stack>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Senha"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon
                            sx={{
                              color: errors.password
                                ? "error.main"
                                : "text.secondary",
                              fontSize: 20,
                            }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={
                              showPassword ? "Ocultar senha" : "Mostrar senha"
                            }
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
                  />
                )}
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                mt: 1,
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Entrar"
              )}
            </Button>
          </Stack>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              ou
            </Typography>
          </Divider>

          {/* Sign Up Link */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Não tem uma conta?{" "}
              <MuiLink
                component={Link}
                href="/signup"
                underline="hover"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  "&:hover": {
                    color: "primary.dark",
                  },
                }}
              >
                Cadastre-se gratuitamente
              </MuiLink>
            </Typography>
          </Box>

          {/* Features hint */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 3 }}
          >
            {[
              { icon: "📊", text: "Relatórios IA" },
              { icon: "🎯", text: "Metas" },
              { icon: "💳", text: "Carteiras" },
            ].map((feature) => (
              <Box
                key={feature.text}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <Typography variant="body2">{feature.icon}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={500}
                >
                  {feature.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Paper>
    </Fade>
  );
}
