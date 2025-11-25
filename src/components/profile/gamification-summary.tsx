// src/components/profile/gamification-summary.tsx

"use client";

import { Card, CardContent, CardHeader } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { Trophy, Award, Flame, Target, TrendingUp } from "lucide-react";
import { useGamification } from "@/hooks/use-gamification";
import { Skeleton } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button, Typography, Box, Stack, Chip, Tooltip } from "@mui/material";

export function GamificationSummary() {
  const {
    gamificationData,
    profileInsights,
    isLoading,
    calculateProgress,
    getLevelInfo,
    getRarityLabel,
    getRarityColors,
  } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Typography variant="h6">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Trophy style={{ width: "1.25rem", height: "1.25rem" }} />
              Progresso Gamificado
            </Stack>
          </Typography>
        </CardHeader>
        <CardContent>
          <Stack spacing={4}>
            <Skeleton sx={{ height: "1rem", width: "100%" }} />
            <Skeleton sx={{ height: "1rem", width: "75%" }} />
            <Skeleton sx={{ height: "1rem", width: "50%" }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!gamificationData) {
    return (
      <Card>
        <CardContent
          sx={{ p: 6, textAlign: "center", color: "text.secondary" }}
        >
          <Trophy
            style={{
              margin: "0 auto",
              width: "2rem",
              height: "2rem",
              marginBottom: "0.5rem",
              opacity: 0.5,
            }}
          />
          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
            Comece a usar o app para ganhar pontos e subir de nível!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const levelInfo = getLevelInfo(gamificationData.level.level);
  const progress = calculateProgress();

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(88, 28, 135, 0.2) 0%, rgba(30, 58, 138, 0.2) 50%, rgba(6, 78, 59, 0.2) 100%)"
            : "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #f0fdf4 100%)",
        borderColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(147, 51, 234, 0.5)" : "#e9d5ff",
      }}
    >
      <CardHeader>
        <Typography variant="h6">
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark" ? "#d8b4fe" : "#6b21a8",
            }}
          >
            <Trophy style={{ width: "1.25rem", height: "1.25rem" }} />
            Seu Progresso
          </Stack>
        </Typography>
      </CardHeader>
      <CardContent>
        <Stack spacing={3}>
          {/* Nível e Pontos com ícone */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 88, 12, 0.3) 100%)"
                      : "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                  border: 1,
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(245, 158, 11, 0.5)"
                      : "rgba(245, 158, 11, 0.3)",
                }}
              >
                {levelInfo.icon}
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#e9d5ff" : "#581c87",
                  }}
                >
                  Nível {gamificationData.level.level}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#c084fc" : "#7e22ce",
                  }}
                >
                  {levelInfo.name} - {levelInfo.title}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#e9d5ff" : "#581c87",
                }}
              >
                {gamificationData.points}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.75rem",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#c084fc" : "#9333ea",
                }}
              >
                pontos XP
              </Typography>
            </Box>
          </Stack>

          {/* Barra de Progresso */}
          <Stack spacing={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{
                fontSize: "0.75rem",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#c084fc" : "#7e22ce",
              }}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{ fontSize: "0.75rem" }}
              >
                Próximo nível
              </Typography>
              <Typography
                component="span"
                variant="body2"
                sx={{ fontSize: "0.75rem" }}
              >
                {progress.current}/{progress.next} XP
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress.progress}
              sx={{
                height: "0.5rem",
                borderRadius: "9999px",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(55, 48, 163, 0.15)"
                    : "rgba(243, 232, 255, 0.8)",
                "& .MuiLinearProgress-bar": {
                  background:
                    "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)",
                  borderRadius: "9999px",
                },
              }}
            />
          </Stack>

          {/* Streak de Pagamentos */}
          {gamificationData.streaks.payments.current > 0 && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{
                p: 1.5,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(124, 45, 18, 0.5)"
                    : "#ffedd5",
                border: 1,
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(154, 52, 18, 0.5)"
                    : "#fed7aa",
                borderRadius: 2,
              }}
            >
              <Flame
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  color: "#f97316",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#fdba74" : "#c2410c",
                }}
              >
                🔥 {gamificationData.streaks.payments.current} meses de
                pagamentos em dia!
              </Typography>
            </Stack>
          )}

          {/* Insights do Perfil */}
          {profileInsights && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(0, 0, 0, 0.2)"
                    : "rgba(255, 255, 255, 0.5)",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <TrendingUp style={{ width: "1rem", height: "1rem" }} />
                <Typography variant="caption" fontWeight={600}>
                  Perfil Financeiro
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={profileInsights.disciplineLevel}
                  size="small"
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(139, 92, 246, 0.1)",
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#c4b5fd" : "#7c3aed",
                    fontWeight: 500,
                  }}
                />
                <Chip
                  label={profileInsights.paymentConsistency}
                  size="small"
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(34, 197, 94, 0.2)"
                        : "rgba(34, 197, 94, 0.1)",
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#86efac" : "#16a34a",
                    fontWeight: 500,
                  }}
                />
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                {profileInsights.motivationalTip}
              </Typography>
            </Box>
          )}

          {/* Badges Recentes */}
          {gamificationData.badges.length > 0 && (
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#c084fc" : "#7e22ce",
                }}
              >
                <Award style={{ width: "0.875rem", height: "0.875rem" }} />
                <Typography variant="caption" fontWeight={600}>
                  Badges Conquistadas ({gamificationData.badges.length})
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {gamificationData.badges.slice(0, 6).map((badge, index) => {
                  const rarityColors = getRarityColors(badge.rarity);
                  return (
                    <Tooltip
                      key={badge.id}
                      title={`${badge.name} - ${
                        badge.description
                      } (${getRarityLabel(badge.rarity)})`}
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Box
                          sx={{
                            width: "2.5rem",
                            height: "2.5rem",
                            borderRadius: "50%",
                            background: rarityColors.gradient,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            border: 2,
                            borderColor: rarityColors.border,
                            boxShadow: `0 0 10px ${rarityColors.border}`,
                          }}
                        >
                          <span style={{ fontSize: "1rem" }}>{badge.icon}</span>
                        </Box>
                      </motion.div>
                    </Tooltip>
                  );
                })}
                {gamificationData.badges.length > 6 && (
                  <Box
                    sx={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "50%",
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark" ? "#374151" : "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "0.75rem",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#d1d5db" : "#4b5563",
                      }}
                    >
                      +{gamificationData.badges.length - 6}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Stack>
          )}

          {/* Conquistas em Progresso */}
          {gamificationData.achievements.filter((a) => !a.isCompleted).length >
            0 && (
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Target style={{ width: "0.875rem", height: "0.875rem" }} />
                <Typography variant="caption" fontWeight={600}>
                  Próximas Conquistas
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {gamificationData.achievements
                  .filter((a) => !a.isCompleted)
                  .slice(0, 2)
                  .map((achievement) => (
                    <Box
                      key={achievement.id}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Typography sx={{ fontSize: "1rem" }}>
                        {achievement.icon}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" fontWeight={500}>
                          {achievement.name}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (achievement.progress / achievement.target) * 100
                          }
                          sx={{ height: 3, borderRadius: 1, mt: 0.5 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.progress}/{achievement.target}
                      </Typography>
                    </Box>
                  ))}
              </Stack>
            </Stack>
          )}

          <Button
            variant="outlined"
            component={Link}
            href="/installments?tab=gamification"
            sx={{ width: "100%", mt: 1 }}
          >
            Ver todos os detalhes
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
