// src/components/gamification/gamification-guide.tsx
// Guia completo do sistema de gamificação

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  useTheme,
  alpha,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Grid,
  Tooltip,
} from "@mui/material";
import {
  Trophy,
  Star,
  Flame,
  Target,
  Award,
  Zap,
  Shield,
  Crown,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  X,
  Sparkles,
  Calendar,
  Gift,
  Gem,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";
import {
  LEVEL_NAMES,
  XP_REWARDS,
  ALL_BADGES,
  DAILY_QUESTS,
  WEEKLY_CHALLENGES,
  MONTHLY_CHALLENGES,
} from "@/lib/gamification-constants";

import { SxProps, Theme } from "@mui/material";

export function GamificationGuide({ sx }: { sx?: SxProps<Theme> }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "levels" | "badges" | "achievements" | "quests"
  >("overview");
  const theme = useTheme();

  const {
    gamificationData,
    calculateProgress,
    getLevelInfo,
    getRarityLabel,
    getRarityColors,
  } = useGamification();

  // Converter níveis do constants para array
  const levels = Object.entries(LEVEL_NAMES).map(([levelNum, info]) => ({
    level: parseInt(levelNum),
    ...info,
    pointsRequired: getLevelThreshold(parseInt(levelNum)),
    benefits: getLevelBenefits(parseInt(levelNum)),
  }));

  // Agrupar badges por categoria
  const badgesByCategory = ALL_BADGES.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof ALL_BADGES>);

  const categoryLabels: Record<string, string> = {
    onboarding: "🌱 Iniciante",
    consistency: "📅 Consistência",
    payments: "💳 Pagamentos",
    installments: "🏁 Parcelamentos",
    budgets: "📊 Orçamentos",
    goals: "🎯 Metas",
    savings: "💰 Economia",
    special: "✨ Especiais",
    recovery: "💪 Recuperação",
  };

  // XP por ação formatado
  const xpActions = [
    {
      category: "Transações",
      actions: [
        { name: "Adicionar transação", xp: XP_REWARDS.ADD_TRANSACTION },
        {
          name: "Categorizar transação",
          xp: XP_REWARDS.CATEGORIZE_TRANSACTION,
        },
        {
          name: "Primeira transação do dia",
          xp: XP_REWARDS.FIRST_TRANSACTION_TODAY,
        },
      ],
    },
    {
      category: "Parcelamentos",
      actions: [
        { name: "Pagar parcela", xp: XP_REWARDS.PAY_INSTALLMENT },
        { name: "Bônus pagamento em dia", xp: XP_REWARDS.PAY_ON_TIME_BONUS },
        { name: "Completar parcelamento", xp: XP_REWARDS.COMPLETE_INSTALLMENT },
        { name: "Atraso (por dia)", xp: XP_REWARDS.LATE_PAYMENT_PENALTY },
      ],
    },
    {
      category: "Orçamentos",
      actions: [
        { name: "Criar orçamento", xp: XP_REWARDS.CREATE_BUDGET },
        {
          name: "Ficar dentro do orçamento",
          xp: XP_REWARDS.STAY_WITHIN_BUDGET,
        },
        {
          name: "Mês perfeito no orçamento",
          xp: XP_REWARDS.PERFECT_BUDGET_MONTH,
        },
      ],
    },
    {
      category: "Metas",
      actions: [
        { name: "Criar meta", xp: XP_REWARDS.CREATE_GOAL },
        { name: "Contribuir para meta", xp: XP_REWARDS.CONTRIBUTE_TO_GOAL },
        { name: "Completar meta", xp: XP_REWARDS.COMPLETE_GOAL },
      ],
    },
    {
      category: "Uso Diário",
      actions: [
        { name: "Login diário", xp: XP_REWARDS.DAILY_LOGIN },
        { name: "Streak semanal", xp: XP_REWARDS.WEEKLY_STREAK },
        { name: "Usar assistente IA", xp: XP_REWARDS.USE_AI_ASSISTANT },
      ],
    },
    {
      category: "Desafios",
      actions: [
        { name: "Desafio diário", xp: XP_REWARDS.COMPLETE_DAILY_QUEST },
        { name: "Desafio semanal", xp: XP_REWARDS.COMPLETE_WEEKLY_CHALLENGE },
        { name: "Desafio mensal", xp: XP_REWARDS.COMPLETE_MONTHLY_CHALLENGE },
      ],
    },
  ];

  const progress = calculateProgress();
  const currentLevelInfo = gamificationData
    ? getLevelInfo(gamificationData.level.level)
    : getLevelInfo(1);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
        startIcon={<HelpCircle style={{ width: "1rem", height: "1rem" }} />}
        sx={{ minWidth: 0, whiteSpace: "nowrap", ...sx }}
      >
        Como Funciona?
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="body"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)"
                : "linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)",
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Trophy
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  color: theme.palette.warning.main,
                }}
              />
              <Typography variant="h6" fontWeight={700}>
                Sistema de Gamificação
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Transforme suas finanças em uma jornada divertida! 🎮
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small">
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              bgcolor: "background.paper",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                value="overview"
                label="Visão Geral"
                icon={<Star size={16} />}
                iconPosition="start"
              />
              <Tab
                value="levels"
                label="10 Níveis"
                icon={<TrendingUp size={16} />}
                iconPosition="start"
              />
              <Tab
                value="badges"
                label={`Badges (${ALL_BADGES.length})`}
                icon={<Award size={16} />}
                iconPosition="start"
              />
              <Tab
                value="achievements"
                label="Conquistas"
                icon={<Trophy size={16} />}
                iconPosition="start"
              />
              <Tab
                value="quests"
                label="Desafios"
                icon={<Target size={16} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            <AnimatePresence mode="wait">
              {/* VISÃO GERAL */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={3}>
                    {/* Status Atual */}
                    {gamificationData && (
                      <Card
                        sx={{
                          background: (theme) =>
                            theme.palette.mode === "dark"
                              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)"
                              : "linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)",
                          border: 1,
                          borderColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(139, 92, 246, 0.3)"
                              : "rgba(139, 92, 246, 0.2)",
                        }}
                      >
                        <CardHeader
                          title={
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Sparkles
                                size={18}
                                color={theme.palette.warning.main}
                              />
                              <Typography variant="h6">
                                Seu Status Atual
                              </Typography>
                            </Stack>
                          }
                        />
                        <CardContent>
                          <Stack spacing={3}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "2rem",
                                    background:
                                      "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                                    boxShadow:
                                      "0 0 20px rgba(245, 158, 11, 0.4)",
                                  }}
                                >
                                  {currentLevelInfo.icon}
                                </Box>
                                <Box>
                                  <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    color="primary"
                                  >
                                    {gamificationData.points} XP
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Nível {gamificationData.level.level} -{" "}
                                    {currentLevelInfo.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {currentLevelInfo.title}
                                  </Typography>
                                </Box>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                {gamificationData.badges
                                  .slice(0, 4)
                                  .map((badge) => {
                                    const colors = getRarityColors(
                                      badge.rarity
                                    );
                                    return (
                                      <Tooltip
                                        key={badge.id}
                                        title={badge.name}
                                      >
                                        <Box
                                          sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "1.25rem",
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
                              </Stack>
                            </Box>

                            <Box>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                sx={{ mb: 1 }}
                              >
                                <Typography variant="caption">
                                  Próximo nível
                                </Typography>
                                <Typography variant="caption">
                                  {progress.current}/{progress.next} XP
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={progress.progress}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.1
                                  ),
                                  "& .MuiLinearProgress-bar": {
                                    background:
                                      "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)",
                                    borderRadius: 5,
                                  },
                                }}
                              />
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    )}

                    {/* Como Ganhar XP */}
                    <Card>
                      <CardHeader
                        title={
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Zap size={18} color={theme.palette.success.main} />
                            <Typography variant="h6">Como Ganhar XP</Typography>
                          </Stack>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          {xpActions.map((category) => (
                            <Grid
                              key={category.category}
                              size={{ xs: 12, sm: 6 }}
                            >
                              <Box
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  border: 1,
                                  borderColor: "divider",
                                  height: "100%",
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={700}
                                  sx={{ mb: 1.5 }}
                                >
                                  {category.category}
                                </Typography>
                                <Stack spacing={1}>
                                  {category.actions.map((action) => (
                                    <Box
                                      key={action.name}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {action.name}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        sx={{
                                          color:
                                            action.xp >= 0
                                              ? "success.main"
                                              : "error.main",
                                        }}
                                      >
                                        {action.xp >= 0 ? "+" : ""}
                                        {action.xp} XP
                                      </Typography>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Motivação */}
                    <Card
                      sx={{
                        background: (theme) =>
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)"
                            : "linear-gradient(135deg, #fffbeb 0%, #fef2f2 100%)",
                      }}
                    >
                      <CardContent sx={{ textAlign: "center", py: 4 }}>
                        <Flame
                          style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            color: theme.palette.warning.main,
                            marginBottom: "1rem",
                          }}
                        />
                        <Typography variant="h6" gutterBottom fontWeight={700}>
                          Por que a Gamificação Funciona?
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ maxWidth: 500, mx: "auto" }}
                        >
                          Estudos mostram que gamificação aumenta o engajamento
                          em até 48%! Ao transformar tarefas financeiras em
                          desafios com recompensas, você cria hábitos positivos
                          e duradouros. Cada XP ganho é um passo em direção à
                          sua liberdade financeira! 🚀
                        </Typography>
                      </CardContent>
                    </Card>
                  </Stack>
                </motion.div>
              )}

              {/* NÍVEIS */}
              {activeTab === "levels" && (
                <motion.div
                  key="levels"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={2}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      São 10 níveis para conquistar! Cada nível desbloqueia
                      novos benefícios e reconhecimentos. Quanto mais você usa o
                      FinWise, mais rápido você evolui.
                    </Typography>

                    {levels.map((level) => {
                      const isCurrentLevel =
                        gamificationData?.level.level === level.level;
                      const isUnlocked =
                        (gamificationData?.points || 0) >= level.pointsRequired;
                      const levelColors = getLevelGradient(level.level);

                      return (
                        <motion.div
                          key={level.level}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: level.level * 0.05 }}
                        >
                          <Card
                            sx={{
                              border: isCurrentLevel ? 2 : 1,
                              borderColor: isCurrentLevel
                                ? "primary.main"
                                : "divider",
                              opacity: isUnlocked ? 1 : 0.6,
                              background: isCurrentLevel
                                ? (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "rgba(139, 92, 246, 0.1)"
                                      : "rgba(139, 92, 246, 0.05)"
                                : undefined,
                            }}
                          >
                            <CardContent
                              sx={{ p: 2, "&:last-child": { pb: 2 } }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 2,
                                  alignItems: "flex-start",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.5rem",
                                    background: levelColors,
                                    boxShadow: isUnlocked
                                      ? `0 0 15px ${alpha(
                                          theme.palette.primary.main,
                                          0.3
                                        )}`
                                      : undefined,
                                    filter: !isUnlocked
                                      ? "grayscale(1)"
                                      : undefined,
                                  }}
                                >
                                  {level.icon}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ mb: 0.5 }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight={700}
                                    >
                                      Nível {level.level} - {level.name}
                                    </Typography>
                                    {isCurrentLevel && (
                                      <Chip
                                        label="Atual"
                                        color="primary"
                                        size="small"
                                      />
                                    )}
                                    {!isUnlocked && (
                                      <Chip
                                        label="Bloqueado"
                                        variant="outlined"
                                        size="small"
                                      />
                                    )}
                                  </Stack>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {level.title}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {level.pointsRequired} XP necessários
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    flexWrap="wrap"
                                    gap={0.5}
                                    sx={{ mt: 1.5 }}
                                  >
                                    {level.benefits.map((benefit, i) => (
                                      <Chip
                                        key={i}
                                        label={benefit}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: "0.7rem" }}
                                      />
                                    ))}
                                  </Stack>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </Stack>
                </motion.div>
              )}

              {/* BADGES */}
              {activeTab === "badges" && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={4}>
                    <Typography variant="body2" color="text.secondary">
                      Colecione {ALL_BADGES.length} badges únicas! Das comuns às
                      míticas, cada badge representa uma conquista especial na
                      sua jornada financeira.
                    </Typography>

                    {/* Raridades */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {["common", "rare", "epic", "legendary", "mythic"].map(
                        (rarity) => {
                          const colors = getRarityColors(rarity);
                          const count = ALL_BADGES.filter(
                            (b) => b.rarity === rarity
                          ).length;
                          return (
                            <Chip
                              key={rarity}
                              label={`${getRarityLabel(rarity)} (${count})`}
                              sx={{
                                bgcolor: colors.bg,
                                color: colors.text,
                                border: 1,
                                borderColor: colors.border,
                                fontWeight: 600,
                              }}
                            />
                          );
                        }
                      )}
                    </Box>

                    {/* Badges por categoria */}
                    {Object.entries(badgesByCategory).map(
                      ([category, badges]) => (
                        <Box key={category}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                          >
                            {categoryLabels[category] || category}
                          </Typography>
                          <Grid container spacing={1.5}>
                            {badges.map((badge) => {
                              const isEarned = gamificationData?.badges.some(
                                (b) => b.id === badge.id
                              );
                              const colors = getRarityColors(badge.rarity);

                              return (
                                <Grid
                                  key={badge.id}
                                  size={{ xs: 6, sm: 4, md: 3 }}
                                >
                                  <Tooltip title={badge.description}>
                                    <Box
                                      sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: 1,
                                        borderColor: isEarned
                                          ? colors.border
                                          : "divider",
                                        bgcolor: isEarned
                                          ? colors.bg
                                          : "background.paper",
                                        textAlign: "center",
                                        opacity: isEarned ? 1 : 0.5,
                                        transition: "all 0.2s",
                                        "&:hover": {
                                          transform: "scale(1.02)",
                                          borderColor: colors.border,
                                        },
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: "50%",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: "1.25rem",
                                          margin: "0 auto",
                                          mb: 1,
                                          background: isEarned
                                            ? colors.gradient
                                            : "transparent",
                                          border: 2,
                                          borderColor: isEarned
                                            ? colors.border
                                            : "divider",
                                        }}
                                      >
                                        {badge.icon}
                                      </Box>
                                      <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        display="block"
                                        noWrap
                                      >
                                        {badge.name}
                                      </Typography>
                                      <Chip
                                        label={getRarityLabel(badge.rarity)}
                                        size="small"
                                        sx={{
                                          mt: 0.5,
                                          height: 18,
                                          fontSize: "0.6rem",
                                          bgcolor: colors.bg,
                                          color: colors.text,
                                          border: 1,
                                          borderColor: colors.border,
                                        }}
                                      />
                                      {isEarned && (
                                        <CheckCircle2
                                          size={14}
                                          color={theme.palette.success.main}
                                          style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Tooltip>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      )
                    )}
                  </Stack>
                </motion.div>
              )}

              {/* CONQUISTAS */}
              {activeTab === "achievements" && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={3}>
                    <Typography variant="body2" color="text.secondary">
                      Conquistas são objetivos de longo prazo que testam sua
                      disciplina financeira. Complete-as para ganhar XP bônus e
                      badges especiais!
                    </Typography>

                    {gamificationData?.achievements.map((achievement) => (
                      <Card
                        key={achievement.id}
                        sx={{
                          border: 1,
                          borderColor: achievement.isCompleted
                            ? "success.main"
                            : "divider",
                          bgcolor: achievement.isCompleted
                            ? alpha(theme.palette.success.main, 0.05)
                            : undefined,
                        }}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.75rem",
                                bgcolor: achievement.isCompleted
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(theme.palette.primary.main, 0.1),
                              }}
                            >
                              {achievement.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mb: 0.5 }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={700}
                                >
                                  {achievement.name}
                                </Typography>
                                {achievement.isCompleted && (
                                  <CheckCircle2
                                    size={18}
                                    color={theme.palette.success.main}
                                  />
                                )}
                              </Stack>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {achievement.description}
                              </Typography>
                              <Box sx={{ mt: 1.5 }}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  sx={{ mb: 0.5 }}
                                >
                                  <Typography variant="caption">
                                    Progresso
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    fontWeight={600}
                                  >
                                    {achievement.progress}/{achievement.target}
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={
                                    (achievement.progress /
                                      achievement.target) *
                                    100
                                  }
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                  }}
                                  color={
                                    achievement.isCompleted
                                      ? "success"
                                      : "primary"
                                  }
                                />
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: "center" }}>
                              <Typography
                                variant="h6"
                                fontWeight={700}
                                color="primary"
                              >
                                +{achievement.points}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                XP
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )) || (
                      <Typography
                        color="text.secondary"
                        textAlign="center"
                        py={4}
                      >
                        Conquistas serão exibidas conforme você progride!
                      </Typography>
                    )}
                  </Stack>
                </motion.div>
              )}

              {/* DESAFIOS */}
              {activeTab === "quests" && (
                <motion.div
                  key="quests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Stack spacing={4}>
                    <Typography variant="body2" color="text.secondary">
                      Complete desafios diários, semanais e mensais para ganhar
                      XP extra! Novos desafios são gerados automaticamente.
                    </Typography>

                    {/* Desafios Diários */}
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 2 }}
                      >
                        <Calendar size={18} color={theme.palette.info.main} />
                        <Typography variant="h6" fontWeight={700}>
                          Desafios Diários
                        </Typography>
                      </Stack>
                      <Grid container spacing={1.5}>
                        {DAILY_QUESTS.map((quest) => (
                          <Grid key={quest.id} size={{ xs: 12, sm: 6 }}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: 1,
                                borderColor: "divider",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Typography sx={{ fontSize: "1.5rem" }}>
                                {quest.icon}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                >
                                  {quest.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {quest.description}
                                </Typography>
                              </Box>
                              <Chip
                                label={`+${quest.xp} XP`}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    {/* Desafios Semanais */}
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 2 }}
                      >
                        <Gift size={18} color={theme.palette.secondary.main} />
                        <Typography variant="h6" fontWeight={700}>
                          Desafios Semanais
                        </Typography>
                      </Stack>
                      <Grid container spacing={1.5}>
                        {WEEKLY_CHALLENGES.map((challenge) => (
                          <Grid key={challenge.id} size={{ xs: 12, sm: 6 }}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: 1,
                                borderColor: "secondary.light",
                                bgcolor: alpha(
                                  theme.palette.secondary.main,
                                  0.03
                                ),
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Typography sx={{ fontSize: "1.5rem" }}>
                                {challenge.icon}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                >
                                  {challenge.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {challenge.description}
                                </Typography>
                              </Box>
                              <Chip
                                label={`+${challenge.xp} XP`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    {/* Desafios Mensais */}
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 2 }}
                      >
                        <Gem size={18} color={theme.palette.warning.main} />
                        <Typography variant="h6" fontWeight={700}>
                          Desafios Mensais
                        </Typography>
                      </Stack>
                      <Grid container spacing={1.5}>
                        {MONTHLY_CHALLENGES.map((challenge) => (
                          <Grid key={challenge.id} size={{ xs: 12 }}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: 1,
                                borderColor: "warning.light",
                                bgcolor: alpha(
                                  theme.palette.warning.main,
                                  0.03
                                ),
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Typography sx={{ fontSize: "1.75rem" }}>
                                {challenge.icon}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={600}
                                >
                                  {challenge.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {challenge.description}
                                </Typography>
                              </Box>
                              <Chip
                                label={`+${challenge.xp} XP`}
                                size="small"
                                sx={{
                                  bgcolor: alpha(
                                    theme.palette.warning.main,
                                    0.1
                                  ),
                                  color: "warning.dark",
                                  fontWeight: 700,
                                }}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helpers
function getLevelThreshold(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
  return thresholds[level - 1] || 0;
}

function getLevelBenefits(level: number): string[] {
  const benefits: Record<number, string[]> = {
    1: ["Controle básico", "Alertas de vencimento"],
    2: ["Relatórios mensais", "Análise de tendências"],
    3: ["Projeções automáticas", "Insights personalizados"],
    4: ["Dashboard avançado", "Metas inteligentes"],
    5: ["Consultoria IA", "Recomendações"],
    6: ["Recursos premium", "Suporte prioritário"],
    7: ["Análise preditiva", "Alertas inteligentes"],
    8: ["Planejamento anual", "Automações"],
    9: ["Coaching financeiro", "Relatórios VIP"],
    10: ["Acesso total", "Benefícios exclusivos"],
  };
  return benefits[level] || [];
}

function getLevelGradient(level: number): string {
  const gradients: Record<number, string> = {
    1: "linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)",
    2: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
    3: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
    4: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)",
    5: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
    6: "linear-gradient(135deg, #F472B6 0%, #EC4899 100%)",
    7: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
    8: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
    9: "linear-gradient(135deg, #E879F9 0%, #D946EF 100%)",
    10: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)",
  };
  return gradients[level] || gradients[1];
}
