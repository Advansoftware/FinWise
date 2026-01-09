// src/components/onboarding/wallet-onboarding.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
  Typography,
  Stack,
  CircularProgress,
  alpha,
  useTheme,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Wallet,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  PiggyBank,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";
import { WalletType } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

const walletSchema = z.object({
  name: z.string().min(1, "O nome da carteira é obrigatório."),
  type: z.enum(
    [
      "Conta Corrente",
      "Cartão de Crédito",
      "Poupança",
      "Investimentos",
      "Dinheiro",
      "Outros",
    ],
    {
      required_error: "O tipo de carteira é obrigatório",
    }
  ),
  initialBalance: z.coerce.number().min(0).optional(),
});

type WalletFormValues = z.infer<typeof walletSchema>;

const walletTypes: {
  type: WalletType;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    type: "Conta Corrente",
    icon: <Banknote size={24} />,
    description: "Conta bancária principal",
  },
  {
    type: "Cartão de Crédito",
    icon: <CreditCard size={24} />,
    description: "Cartão de crédito",
  },
  {
    type: "Poupança",
    icon: <PiggyBank size={24} />,
    description: "Conta poupança",
  },
  {
    type: "Investimentos",
    icon: <TrendingUp size={24} />,
    description: "Corretora ou investimentos",
  },
  {
    type: "Dinheiro",
    icon: <Banknote size={24} />,
    description: "Dinheiro em espécie",
  },
  { type: "Outros", icon: <Wallet size={24} />, description: "Outras fontes" },
];

interface WalletOnboardingProps {
  forceOpen?: boolean;
}

export function WalletOnboarding({ forceOpen }: WalletOnboardingProps) {
  const theme = useTheme();
  const { wallets, isLoading, addWallet } = useWallets();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      type: "Conta Corrente",
      initialBalance: 0,
    },
  });

  const selectedType = watch("type");

  // Auto-open when user has no wallets (first time user)
  // If user has wallets, they already completed onboarding - no flag needed
  useEffect(() => {
    if (!isLoading && wallets.length === 0 && !isComplete) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [wallets.length, isLoading, isComplete]);

  // Force open from parent
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const onSubmit = async (data: WalletFormValues) => {
    setIsSubmitting(true);
    try {
      await addWallet({
        name: data.name,
        type: data.type,
      });
      setIsComplete(true);
      setStep(2);
      // Auto close after success animation
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipOnboarding = () => {
    // Just close - if user has no wallets, it will show again next time
    // This is intentional: we want users to create at least one wallet
    setIsOpen(false);
  };

  const handleTypeSelect = (type: WalletType) => {
    setValue("type", type);
    setStep(1);
  };

  const steps = ["Escolha o tipo", "Detalhes", "Concluído"];

  // Don't render if loading or if user has wallets
  if (isLoading) return null;
  if (wallets.length > 0 && !forceOpen) return null;

  return (
    <Dialog
      open={isOpen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: `linear-gradient(145deg, ${alpha(
            theme.palette.background.paper,
            0.98
          )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          backdropFilter: "blur(20px)",
          overflow: "hidden",
        },
      }}
      // Prevent closing by clicking outside or pressing escape
      disableEscapeKeyDown
      // Make backdrop completely opaque to hide content behind
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
          },
        },
      }}
      // Highest z-index to cover everything including bottom nav
      sx={{
        zIndex: 9999,
        "& .MuiDialog-container": {
          zIndex: 9999,
        },
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: "white",
          px: 3,
          py: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha("#fff", 0.2),
            }}
          >
            <Sparkles size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Bem-vindo ao Gastometria! 🎉
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Vamos criar sua primeira carteira para começar
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <AnimatePresence mode="wait">
          {/* Step 0: Choose wallet type */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Qual tipo de carteira você quer criar primeiro?
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                }}
              >
                {walletTypes.map(({ type, icon, description }) => (
                  <Box
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: 2,
                      borderColor:
                        selectedType === type ? "primary.main" : "divider",
                      bgcolor:
                        selectedType === type
                          ? alpha(theme.palette.primary.main, 0.1)
                          : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ color: "primary.main" }}>{icon}</Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </motion.div>
          )}

          {/* Step 1: Wallet details */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Agora, dê um nome para sua carteira:
              </Typography>
              <form
                onSubmit={handleSubmit(onSubmit)}
                id="onboarding-wallet-form"
              >
                <Stack spacing={3}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nome da Carteira"
                        placeholder="Ex: Conta Principal, Nubank..."
                        fullWidth
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        autoFocus
                      />
                    )}
                  />
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      border: 1,
                      borderColor: alpha(theme.palette.info.main, 0.2),
                    }}
                  >
                    <Typography variant="body2" color="info.main">
                      💡 <strong>Dica:</strong> Você pode criar mais carteiras
                      depois nas configurações.
                    </Typography>
                  </Box>
                </Stack>
              </form>
            </motion.div>
          )}

          {/* Step 2: Success */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box sx={{ textAlign: "center", py: 4 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 100,
                    delay: 0.2,
                  }}
                >
                  <CheckCircle2 size={80} color={theme.palette.success.main} />
                </motion.div>
                <Typography variant="h5" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
                  Carteira criada com sucesso!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Agora você pode começar a registrar suas transações. Bom
                  controle financeiro! 🚀
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {step < 2 && (
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
          <Button
            variant="text"
            color="inherit"
            onClick={handleSkipOnboarding}
            sx={{ opacity: 0.7 }}
          >
            Pular por agora
          </Button>
          <Box>
            {step > 0 && (
              <Button
                variant="outlined"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
                sx={{ mr: 1 }}
              >
                Voltar
              </Button>
            )}
            {step === 1 && (
              <Button
                type="submit"
                form="onboarding-wallet-form"
                variant="contained"
                disabled={isSubmitting}
                endIcon={
                  isSubmitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <ArrowRight size={16} />
                  )
                }
              >
                Criar Carteira
              </Button>
            )}
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
}
