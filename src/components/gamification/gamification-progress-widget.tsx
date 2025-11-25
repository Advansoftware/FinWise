// src/components/gamification/gamification-progress-widget.tsx
// Widget compacto de progresso de gamificação para usar em qualquer página

"use client";

import {
  Box,
  Typography,
  Stack,
  LinearProgress,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { Trophy, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";

interface GamificationProgressWidgetProps {
  variant?: "compact" | "expanded";
  showStreak?: boolean;
  showBadges?: boolean;
}

export function GamificationProgressWidget({
  variant = "compact",
  showStreak = true,
  showBadges = false,
}: GamificationProgressWidgetProps) {
  const theme = useTheme();
  const { gamificationData, calculateProgress, getLevelInfo, getRarityColors } =
    useGamification();

  if (!gamificationData) {
    return null;
  }

  const progress = calculateProgress();
  const levelInfo = getLevelInfo(gamificationData.level.level);

  if (variant === "compact") {
    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {levelInfo.name} - {levelInfo.title}
            </Typography>
            <Typography variant="caption">
              {gamificationData.points} XP • {progress.progress.toFixed(0)}%
              para próximo nível
            </Typography>
          </Box>
        }
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
            border: 1,
            borderColor: "divider",
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
            }}
          >
            {levelInfo.icon}
          </Box>
          <Box sx={{ minWidth: 60 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              display="block"
              lineHeight={1.2}
            >
              Nv. {gamificationData.level.level}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress.progress}
              sx={{
                height: 3,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                "& .MuiLinearProgress-bar": {
                  background:
                    "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)",
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>
          {showStreak && gamificationData.streaks.payments.current > 0 && (
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <Flame size={14} color="#F97316" />
              <Typography
                variant="caption"
                fontWeight={700}
                color="warning.main"
              >
                {gamificationData.streaks.payments.current}
              </Typography>
            </Stack>
          )}
        </Box>
      </Tooltip>
    );
  }

  // Expanded variant
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)"
            : "linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)",
        border: 1,
        borderColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(139, 92, 246, 0.2)"
            : "rgba(139, 92, 246, 0.15)",
      }}
    >
      <Stack spacing={2}>
        {/* Header com nível e XP */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                  boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
                }}
              >
                {levelInfo.icon}
              </Box>
            </motion.div>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Nível {gamificationData.level.level}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {levelInfo.name} - {levelInfo.title}
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ textAlign: "right" }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Zap size={16} color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight={700} color="primary">
                {gamificationData.points}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              XP Total
            </Typography>
          </Box>
        </Stack>

        {/* Barra de progresso */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              Próximo nível
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {progress.current}/{progress.next} XP
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)",
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* Streak */}
        {showStreak && gamificationData.streaks.payments.current > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              border: 1,
              borderColor: alpha(theme.palette.warning.main, 0.2),
            }}
          >
            <Flame size={18} color="#F97316" />
            <Typography variant="body2" fontWeight={600} color="warning.dark">
              🔥 {gamificationData.streaks.payments.current} meses de pagamentos
              em dia!
            </Typography>
          </Stack>
        )}

        {/* Badges recentes */}
        {showBadges && gamificationData.badges.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Badges Recentes
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {gamificationData.badges.slice(0, 5).map((badge) => {
                const colors = getRarityColors(badge.rarity);
                return (
                  <Tooltip key={badge.id} title={badge.name}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        background: colors.gradient,
                        border: 2,
                        borderColor: colors.border,
                      }}
                    >
                      {badge.icon}
                    </Box>
                  </Tooltip>
                );
              })}
              {gamificationData.badges.length > 5 && (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                  }}
                >
                  <Typography variant="caption" fontWeight={600}>
                    +{gamificationData.badges.length - 5}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
