// src/components/billing/upgrade-celebration.tsx
// Celebração de upgrade de plano com confetti e animações

"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { motion } from "framer-motion";
import { Star, Sparkles, Crown, Zap, Rocket } from "lucide-react";
import confetti from "canvas-confetti";

interface UpgradeCelebrationProps {
  onComplete: () => void;
  planName?: string;
}

export const UpgradeCelebration = ({
  onComplete,
  planName = "Premium",
}: UpgradeCelebrationProps) => {
  useEffect(() => {
    // Confetti mais elaborado para upgrade
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti dos dois lados
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
        colors: ["#FFD700", "#FFA500", "#9333EA", "#3B82F6", "#EC4899"],
      });
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ["#FFD700", "#FFA500", "#9333EA", "#3B82F6", "#EC4899"],
      });
    }, 250);

    // Confetti central inicial
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FFA500", "#9333EA", "#3B82F6"],
    });

    return () => clearInterval(interval);
  }, []);

  const getPlanIcon = () => {
    switch (planName) {
      case "Pro":
        return <Zap size={48} />;
      case "Plus":
        return <Rocket size={48} />;
      default:
        return <Crown size={48} />;
    }
  };

  const getPlanColor = () => {
    switch (planName) {
      case "Pro":
        return "#8B5CF6";
      case "Plus":
        return "#3B82F6";
      default:
        return "#F59E0B";
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onComplete}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)`
              : `linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf2f8 100%)`,
          border: 2,
          borderColor: getPlanColor(),
          borderRadius: 4,
          overflow: "visible",
        },
      }}
    >
      <DialogContent sx={{ p: 5, textAlign: "center" }}>
        <Stack alignItems="center" spacing={3}>
          {/* Ícone animado */}
          <Box sx={{ position: "relative" }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${getPlanColor()} 0%, ${getPlanColor()}99 100%)`,
                  color: "#fff",
                  boxShadow: `0 0 60px ${getPlanColor()}80`,
                }}
              >
                {getPlanIcon()}
              </Box>
            </motion.div>

            {/* Sparkles animados */}
            <motion.div
              style={{ position: "absolute", top: -10, left: -10 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={24} color="#FFD700" />
            </motion.div>
            <motion.div
              style={{ position: "absolute", top: -5, right: -15 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Star size={20} color="#EC4899" fill="#EC4899" />
            </motion.div>
            <motion.div
              style={{ position: "absolute", bottom: 0, right: -20 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={18} color="#3B82F6" />
            </motion.div>
          </Box>

          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Typography
              variant="overline"
              sx={{
                color: getPlanColor(),
                letterSpacing: 3,
                fontWeight: 700,
              }}
            >
              PARABÉNS!
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${getPlanColor()} 0%, #EC4899 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Upgrade Realizado!
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 350 }}
            >
              Bem-vindo ao plano <strong>{planName}</strong>! Agora você tem
              acesso a recursos exclusivos para turbinar suas finanças. 🚀
            </Typography>
          </motion.div>

          {/* XP Bonus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                bgcolor: "rgba(34, 197, 94, 0.1)",
                border: 1,
                borderColor: "rgba(34, 197, 94, 0.3)",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ color: "success.main", fontWeight: 700 }}
              >
                🎁 +500 XP de Bônus!
              </Typography>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={onComplete}
              sx={{
                mt: 2,
                px: 5,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${getPlanColor()} 0%, #EC4899 100%)`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${getPlanColor()}dd 0%, #EC4899dd 100%)`,
                },
              }}
            >
              Começar a Explorar! 🎉
            </Button>
          </motion.div>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
