// src/components/gamification/daily-quests-card.tsx
// Card de missões diárias que aparece em todas as páginas

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Target,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";

interface Quest {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  type: "daily" | "weekly" | "monthly";
  progress: number;
  target: number;
  isCompleted: boolean;
}

interface DailyQuestsCardProps {
  pageContext?:
    | "dashboard"
    | "transactions"
    | "installments"
    | "budgets"
    | "goals"
    | "wallets"
    | "profile";
  compact?: boolean;
}

export function DailyQuestsCard({
  pageContext = "dashboard",
  compact = false,
}: DailyQuestsCardProps) {
  const theme = useTheme();
  const { gamificationData } = useGamification();
  const [expanded, setExpanded] = useState(!compact);

  // Gerar missões baseadas no contexto da página
  const getPageQuests = (): Quest[] => {
    const baseQuests: Quest[] = [
      {
        id: "daily-login",
        name: "Login Diário",
        description: "Acesse o app hoje",
        icon: "📱",
        xp: 5,
        type: "daily",
        progress: 1,
        target: 1,
        isCompleted: true,
      },
    ];

    const contextQuests: Record<string, Quest[]> = {
      dashboard: [
        {
          id: "view-dashboard",
          name: "Visão Geral",
          description: "Visualize seu painel financeiro",
          icon: "📊",
          xp: 5,
          type: "daily",
          progress: 1,
          target: 1,
          isCompleted: true,
        },
        {
          id: "add-transaction",
          name: "Registrar Hoje",
          description: "Adicione uma transação hoje",
          icon: "📝",
          xp: 15,
          type: "daily",
          progress: gamificationData ? Math.min(1, 1) : 0, // TODO: conectar com transações do dia
          target: 1,
          isCompleted: false,
        },
      ],
      transactions: [
        {
          id: "categorize-5",
          name: "Organizador",
          description: "Categorize 5 transações",
          icon: "🏷️",
          xp: 20,
          type: "daily",
          progress: 0,
          target: 5,
          isCompleted: false,
        },
        {
          id: "review-expenses",
          name: "Analista",
          description: "Revise seus gastos da semana",
          icon: "🔍",
          xp: 10,
          type: "weekly",
          progress: 0,
          target: 1,
          isCompleted: false,
        },
      ],
      installments: [
        {
          id: "pay-installment",
          name: "Pagador",
          description: "Pague uma parcela",
          icon: "💳",
          xp: 15,
          type: "daily",
          progress: 0,
          target: 1,
          isCompleted: false,
        },
        {
          id: "check-upcoming",
          name: "Previsor",
          description: "Verifique próximos vencimentos",
          icon: "📅",
          xp: 5,
          type: "daily",
          progress: 1,
          target: 1,
          isCompleted: true,
        },
      ],
      budgets: [
        {
          id: "create-budget",
          name: "Planejador",
          description: "Crie ou ajuste um orçamento",
          icon: "📋",
          xp: 15,
          type: "weekly",
          progress: 0,
          target: 1,
          isCompleted: false,
        },
        {
          id: "stay-within",
          name: "Controlado",
          description: "Fique dentro do orçamento hoje",
          icon: "✅",
          xp: 20,
          type: "daily",
          progress: 0,
          target: 1,
          isCompleted: false,
        },
      ],
      goals: [
        {
          id: "contribute-goal",
          name: "Investidor",
          description: "Contribua para uma meta",
          icon: "🎯",
          xp: 15,
          type: "weekly",
          progress: 0,
          target: 1,
          isCompleted: false,
        },
        {
          id: "check-progress",
          name: "Acompanhador",
          description: "Verifique o progresso das metas",
          icon: "📈",
          xp: 5,
          type: "daily",
          progress: 1,
          target: 1,
          isCompleted: true,
        },
      ],
      wallets: [
        {
          id: "balance-check",
          name: "Conferente",
          description: "Verifique os saldos das carteiras",
          icon: "💰",
          xp: 5,
          type: "daily",
          progress: 1,
          target: 1,
          isCompleted: true,
        },
        {
          id: "organize-wallets",
          name: "Organizado",
          description: "Mantenha suas carteiras atualizadas",
          icon: "🗂️",
          xp: 10,
          type: "weekly",
          progress: 0,
          target: 1,
          isCompleted: false,
        },
      ],
      profile: [
        {
          id: "complete-profile",
          name: "Perfil Completo",
          description: "Mantenha seu perfil atualizado",
          icon: "👤",
          xp: 10,
          type: "weekly",
          progress: 1,
          target: 1,
          isCompleted: true,
        },
        {
          id: "check-achievements",
          name: "Colecionador",
          description: "Verifique suas conquistas",
          icon: "🏆",
          xp: 5,
          type: "daily",
          progress: 1,
          target: 1,
          isCompleted: true,
        },
      ],
    };

    return [...baseQuests, ...(contextQuests[pageContext] || [])];
  };

  const quests = getPageQuests();
  const completedCount = quests.filter((q) => q.isCompleted).length;
  const totalXp = quests.reduce(
    (sum, q) => sum + (q.isCompleted ? q.xp : 0),
    0
  );
  const potentialXp = quests.reduce((sum, q) => sum + q.xp, 0);

  const getTypeIcon = (type: Quest["type"]) => {
    switch (type) {
      case "daily":
        return <Clock size={12} />;
      case "weekly":
        return <Calendar size={12} />;
      case "monthly":
        return <Gift size={12} />;
    }
  };

  const getTypeColor = (type: Quest["type"]) => {
    switch (type) {
      case "daily":
        return "info";
      case "weekly":
        return "secondary";
      case "monthly":
        return "warning";
    }
  };

  if (compact) {
    return (
      <Card
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.05)
              : alpha(theme.palette.primary.main, 0.02),
          border: 1,
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            onClick={() => setExpanded(!expanded)}
            sx={{ cursor: "pointer" }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Target size={16} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" fontWeight={600}>
                Missões do Dia
              </Typography>
              <Chip
                label={`${completedCount}/${quests.length}`}
                size="small"
                color={completedCount === quests.length ? "success" : "default"}
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="caption"
                color="success.main"
                fontWeight={600}
              >
                +{totalXp}/{potentialXp} XP
              </Typography>
              <IconButton size="small">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </IconButton>
            </Stack>
          </Stack>

          <Collapse in={expanded}>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {quests.map((quest) => (
                <QuestItem key={quest.id} quest={quest} compact />
              ))}
            </Stack>
          </Collapse>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
            : "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
        border: 1,
        borderColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(59, 130, 246, 0.2)"
            : "rgba(59, 130, 246, 0.15)",
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Target size={20} color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={700}>
              Missões
            </Typography>
          </Stack>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            Complete missões para ganhar XP e subir de nível!
          </Typography>
        }
        action={
          <Chip
            icon={<Zap size={14} />}
            label={`${totalXp}/${potentialXp} XP`}
            color={completedCount === quests.length ? "success" : "primary"}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Stack spacing={1.5}>
          <AnimatePresence>
            {quests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <QuestItem quest={quest} />
              </motion.div>
            ))}
          </AnimatePresence>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuestItem({
  quest,
  compact = false,
}: {
  quest: Quest;
  compact?: boolean;
}) {
  const theme = useTheme();
  const progress = (quest.progress / quest.target) * 100;

  return (
    <Box
      sx={{
        p: compact ? 1 : 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: quest.isCompleted ? "success.main" : "divider",
        bgcolor: quest.isCompleted
          ? alpha(theme.palette.success.main, 0.05)
          : "background.paper",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: quest.isCompleted ? "success.main" : "primary.main",
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={compact ? 1 : 1.5}>
        <Box
          sx={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: compact ? "1rem" : "1.25rem",
            bgcolor: quest.isCompleted
              ? alpha(theme.palette.success.main, 0.1)
              : alpha(theme.palette.primary.main, 0.1),
          }}
        >
          {quest.isCompleted ? (
            <CheckCircle2
              size={compact ? 16 : 20}
              color={theme.palette.success.main}
            />
          ) : (
            quest.icon
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography
              variant={compact ? "caption" : "subtitle2"}
              fontWeight={600}
              noWrap
              sx={{
                textDecoration: quest.isCompleted ? "line-through" : "none",
                opacity: quest.isCompleted ? 0.7 : 1,
              }}
            >
              {quest.name}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip
                title={
                  quest.type === "daily"
                    ? "Diária"
                    : quest.type === "weekly"
                    ? "Semanal"
                    : "Mensal"
                }
              >
                <Chip
                  icon={getTypeIcon(quest.type)}
                  label={
                    quest.type === "daily"
                      ? "D"
                      : quest.type === "weekly"
                      ? "S"
                      : "M"
                  }
                  size="small"
                  color={getTypeColor(quest.type) as any}
                  variant="outlined"
                  sx={{
                    height: compact ? 18 : 22,
                    fontSize: "0.6rem",
                    "& .MuiChip-icon": { fontSize: "0.7rem" },
                  }}
                />
              </Tooltip>
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  color: quest.isCompleted ? "success.main" : "primary.main",
                }}
              >
                +{quest.xp}
              </Typography>
            </Stack>
          </Stack>

          {!compact && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {quest.description}
            </Typography>
          )}

          {!quest.isCompleted && quest.target > 1 && (
            <Box sx={{ mt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.65rem" }}
              >
                {quest.progress}/{quest.target}
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

// Helper functions
function getTypeIcon(type: Quest["type"]) {
  switch (type) {
    case "daily":
      return <Clock size={10} />;
    case "weekly":
      return <Calendar size={10} />;
    case "monthly":
      return <Gift size={10} />;
  }
}

function getTypeColor(type: Quest["type"]) {
  switch (type) {
    case "daily":
      return "info";
    case "weekly":
      return "secondary";
    case "monthly":
      return "warning";
  }
}
