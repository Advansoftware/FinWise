// src/components/gamification/badge-unlock-celebration.tsx
// Componente de celebração de badge desbloqueada

"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";
import confetti from "canvas-confetti";

export function BadgeUnlockCelebration() {
  const { newBadgeEvent, clearNewBadgeEvent, getRarityLabel, getRarityColors } =
    useGamification();

  useEffect(() => {
    if (newBadgeEvent) {
      // Confetti mais suave para badges
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#9333EA"],
      });
    }
  }, [newBadgeEvent]);

  if (!newBadgeEvent) return null;

  const { badge } = newBadgeEvent;
  const rarityColors = getRarityColors(badge.rarity);

  return (
    <Dialog
      open={!!newBadgeEvent}
      onClose={clearNewBadgeEvent}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${rarityColors.bg} 0%, rgba(0,0,0,0.9) 100%)`
              : `linear-gradient(135deg, ${rarityColors.bg} 0%, #fff 100%)`,
          border: 1,
          borderColor: rarityColors.border,
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={3}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                background: rarityColors.gradient,
                boxShadow: `0 0 40px ${rarityColors.border}`,
              }}
            >
              {badge.icon}
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                letterSpacing: 2,
                textAlign: "center",
                display: "block",
              }}
            >
              NOVA BADGE!
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                textAlign: "center",
                color: rarityColors.text,
              }}
            >
              {badge.name}
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
              }}
            >
              {badge.description}
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Chip
              label={getRarityLabel(badge.rarity)}
              size="small"
              sx={{
                bgcolor: rarityColors.bg,
                color: rarityColors.text,
                border: 1,
                borderColor: rarityColors.border,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              variant="contained"
              onClick={clearNewBadgeEvent}
              sx={{
                mt: 1,
                px: 4,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              Incrível! 🎉
            </Button>
          </motion.div>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
