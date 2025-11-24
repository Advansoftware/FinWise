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
  Person as PersonIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

const formSchema = z
  .object({
    name: z.string().min(1, { message: "O nome é obrigatório." }),
    email: z.string().email({ message: "Por favor, insira um email válido." }),
    password: z
      .string()
      .min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await signup(values.email, values.password, values.name);
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao Gastometria!",
        variant: "success",
      });
      router.push("/dashboard");
    } catch (error: any) {
      let description = error.message || "Ocorreu um erro. Tente novamente.";
      if (error.message?.includes("já está em uso")) {
        description = "Este endereço de e-mail já está em uso.";
      }
      toast({
        variant: "error",
        title: "Erro ao Criar Conta",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "text.disabled" };
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: "Fraca", color: "error.main" };
    if (strength <= 3)
      return { strength, label: "Média", color: "warning.main" };
    return { strength, label: "Forte", color: "success.main" };
  };

  const passwordStrength = getPasswordStrength(password);

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
            Crie sua conta
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 300, mx: "auto" }}
          >
            É rápido e fácil. Comece a organizar suas finanças hoje mesmo.
          </Typography>
        </Box>

        {/* Form Section */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 4, sm: 5 } }}
        >
          <Stack spacing={2.5}>
            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome completo"
                  placeholder="Seu nome"
                  fullWidth
                  autoComplete="name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon
                          sx={{
                            color: errors.name
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
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Senha"
                    placeholder="Mínimo 6 caracteres"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    autoComplete="new-password"
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
              {/* Password Strength Indicator */}
              {password && (
                <Box
                  sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        height: "100%",
                        bgcolor: passwordStrength.color,
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: passwordStrength.color, fontWeight: 500 }}
                  >
                    {passwordStrength.label}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Confirm Password Field */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirmar senha"
                  placeholder="Digite a senha novamente"
                  type={showConfirmPassword ? "text" : "password"}
                  fullWidth
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CheckIcon
                          sx={{
                            color: errors.confirmPassword
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
                            showConfirmPassword
                              ? "Ocultar senha"
                              : "Mostrar senha"
                          }
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
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
                />
              )}
            />

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
                "Criar conta"
              )}
            </Button>
          </Stack>

          {/* Terms notice */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 2,
              px: 2,
            }}
          >
            Ao criar sua conta, você concorda com nossos{" "}
            <MuiLink href="/terms" underline="hover" color="primary">
              Termos de Uso
            </MuiLink>{" "}
            e{" "}
            <MuiLink href="/privacy" underline="hover" color="primary">
              Política de Privacidade
            </MuiLink>
          </Typography>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              ou
            </Typography>
          </Divider>

          {/* Login Link */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Já tem uma conta?{" "}
              <MuiLink
                component={Link}
                href="/login"
                underline="hover"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  "&:hover": {
                    color: "primary.dark",
                  },
                }}
              >
                Faça login
              </MuiLink>
            </Typography>
          </Box>

          {/* Features hint */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 3 }}
          >
            {[
              { icon: "✨", text: "Grátis para começar" },
              { icon: "🔒", text: "Dados seguros" },
              { icon: "📱", text: "Acesso em qualquer lugar" },
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
