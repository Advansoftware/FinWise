// src/components/gamification/xp-notification.tsx
// Componente de notificação de XP ganho - Aparece globalmente

"use client";

import { Box, Typography, Paper, Stack } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";

export function XpNotificationContainer() {
  const { xpNotifications, clearXpNotification } = useGamification();

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: 80, md: 24 },
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence mode="popLayout">
        {xpNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={() => clearXpNotification(notification.id)}
            style={{ pointerEvents: "auto", cursor: "pointer" }}
          >
            <Paper
              elevation={8}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)"
                    : "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
                border: 1,
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(34, 197, 94, 0.5)"
                    : "rgba(34, 197, 94, 0.3)",
                backdropFilter: "blur(8px)",
                minWidth: 200,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    bgcolor: "rgba(34, 197, 94, 0.2)",
                  }}
                >
                  {notification.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      lineHeight: 1.2,
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "success.main",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    +{notification.xp} XP
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
}
