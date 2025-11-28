// src/components/gamification/level-up-celebration.tsx
// Componente de celebração de level up - Modal global com animação

"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";
import confetti from "canvas-confetti";

export function LevelUpCelebration() {
  const { levelUpEvent, clearLevelUpEvent, getLevelInfo } = useGamification();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (levelUpEvent && !showConfetti) {
      setShowConfetti(true);

      // Dispara confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#7B68EE", "#00CED1"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#7B68EE", "#00CED1"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [levelUpEvent, showConfetti]);

  const handleClose = () => {
    setShowConfetti(false);
    clearLevelUpEvent();
  };

  if (!levelUpEvent) return null;

  const newLevelInfo = getLevelInfo(levelUpEvent.newLevel);

  return (
    <Dialog
      open={!!levelUpEvent}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: "relative", minHeight: 400 }}>
        {/* Background stars */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              width: "200%",
              height: "200%",
              top: "-50%",
              left: "-50%",
              background: `
                radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
              `,
            },
          }}
        />

        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={3}
          sx={{ p: 4, position: "relative", zIndex: 1 }}
        >
          <AnimatePresence>
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
                  fontSize: "4rem",
                  background:
                    "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                  boxShadow: "0 0 60px rgba(255, 215, 0, 0.5)",
                }}
              >
                {newLevelInfo.icon}
              </Box>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                letterSpacing: 3,
                textAlign: "center",
                display: "block",
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
              variant="h3"
              sx={{
                color: "#fff",
                fontWeight: 800,
                textAlign: "center",
                textShadow: "0 2px 20px rgba(0,0,0,0.3)",
              }}
            >
              Nível {levelUpEvent.newLevel}
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "#FFD700",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {newLevelInfo.name}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.8)",
                textAlign: "center",
                mt: 0.5,
              }}
            >
              {newLevelInfo.title}
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                Você subiu do nível {levelUpEvent.previousLevel} para o nível{" "}
                {levelUpEvent.newLevel}!
              </Typography>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                mt: 2,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                bgcolor: "#FFD700",
                color: "#1a1a2e",
                "&:hover": {
                  bgcolor: "#FFA500",
                },
              }}
            >
              Continuar 🚀
            </Button>
          </motion.div>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
