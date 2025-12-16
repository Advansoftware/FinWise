// src/components/goals/goal-highlight-card.tsx
"use client";

import { useGoals } from "@/hooks/use-goals";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  CardActions,
  Button,
  LinearProgress,
  Box,
  Stack,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import { Target, PiggyBank, Calendar } from "lucide-react";
import Link from "next/link";
import { AddDepositDialog } from "./add-deposit-dialog";
import { useMemo } from "react";
import { format, addMonths, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export function GoalHighlightCard() {
  const { goals, isLoading: isGoalsLoading } = useGoals();
  const theme = useTheme();

  const firstGoal = useMemo(() => {
    if (!goals || goals.length === 0) return null;
    return goals.find((g) => g.currentAmount < g.targetAmount) || goals[0];
  }, [goals]);

  // Cálculo matemático da previsão de conclusão
  const projectionData = useMemo(() => {
    if (!firstGoal) return null;

    const remaining = firstGoal.targetAmount - firstGoal.currentAmount;

    // Meta já concluída
    if (remaining <= 0) {
      return { type: "completed" as const, message: "Meta concluída!" };
    }

    // Se não tem depósito mensal definido
    if (!firstGoal.monthlyDeposit || firstGoal.monthlyDeposit <= 0) {
      return {
        type: "no-deposit" as const,
        message: "Defina um depósito mensal",
      };
    }

    // Calcular meses necessários
    const monthsNeeded = Math.ceil(remaining / firstGoal.monthlyDeposit);
    const estimatedDate = addMonths(new Date(), monthsNeeded);

    // Verificar se vai atingir antes da data alvo
    const targetDate = firstGoal.targetDate
      ? parseISO(firstGoal.targetDate)
      : null;
    const willMeetTarget = targetDate
      ? isBefore(estimatedDate, targetDate) ||
        estimatedDate.getTime() === targetDate.getTime()
      : true;

    return {
      type: "estimated" as const,
      date: estimatedDate,
      monthsNeeded,
      willMeetTarget,
    };
  }, [firstGoal]);

  if (isGoalsLoading) {
    return (
      <Card>
        <CardHeader sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PiggyBank style={{ width: 16, height: 16 }} />
            <Typography variant="body2">Metas</Typography>
          </Stack>
        </CardHeader>
        <CardContent sx={{ pb: 1.5 }}>
          <Stack spacing={1}>
            <Skeleton variant="rounded" sx={{ height: 16, width: "75%" }} />
            <Skeleton variant="rounded" sx={{ height: 12, width: "100%" }} />
            <Skeleton variant="rounded" sx={{ height: 8, width: "100%" }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!firstGoal) {
    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 2,
        }}
      >
        <Target
          style={{
            width: 32,
            height: 32,
            color: alpha(theme.palette.primary.main, 0.7),
            marginBottom: 8,
          }}
        />
        <Typography variant="subtitle1">Crie sua Primeira Meta</Typography>
        <CardContent sx={{ p: 0, mt: 0.5, mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Comece a economizar para seus sonhos.
          </Typography>
        </CardContent>
        <Button size="small" component={Link} href="/goals">
          Criar Meta
        </Button>
      </Card>
    );
  }

  const percentage = Math.round(
    (firstGoal.currentAmount / firstGoal.targetAmount) * 100
  );

  const getProjectionText = () => {
    if (!projectionData) return null;

    if (projectionData.type === "completed") {
      return (
        <Typography
          component="span"
          sx={{ color: "success.main", fontWeight: 600 }}
        >
          {projectionData.message}
        </Typography>
      );
    }

    if (projectionData.type === "no-deposit") {
      return (
        <Typography component="span" sx={{ color: "text.secondary" }}>
          {projectionData.message}
        </Typography>
      );
    }

    if (projectionData.type === "estimated") {
      return (
        <Typography component="span">
          Previsão:{" "}
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              color: projectionData.willMeetTarget
                ? "success.main"
                : "warning.main",
              textTransform: "capitalize",
            }}
          >
            {format(projectionData.date, "MMM 'de' yyyy", { locale: ptBR })}
          </Typography>
          <Typography
            component="span"
            sx={{ color: "text.secondary", ml: 0.5 }}
          >
            ({projectionData.monthsNeeded}{" "}
            {projectionData.monthsNeeded === 1 ? "mês" : "meses"})
          </Typography>
        </Typography>
      );
    }

    return null;
  };

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardHeader sx={{ pb: 1, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              p: 0.5,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.2),
            }}
          >
            <Target
              style={{
                width: 12,
                height: 12,
                color: theme.palette.primary.main,
              }}
            />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
              }}
            >
              {firstGoal.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sua meta em destaque
            </Typography>
          </Box>
        </Stack>
      </CardHeader>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          pb: 1.5,
          flex: 1,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          sx={{ height: 6 }}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>
            R$ {firstGoal.currentAmount.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            de R$ {firstGoal.targetAmount.toFixed(2)}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ fontSize: "0.75rem", color: "text.secondary" }}
        >
          <Calendar
            style={{
              width: 12,
              height: 12,
              color: alpha(theme.palette.primary.main, 0.8),
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getProjectionText()}
          </Box>
        </Stack>
      </CardContent>
      <CardActions sx={{ display: "flex", gap: 1, p: 2, pt: 0, flexShrink: 0 }}>
        <Button
          variant="outlined"
          sx={{ flex: 1 }}
          size="small"
          component={Link}
          href="/goals"
        >
          Ver Todas
        </Button>
        <AddDepositDialog goal={firstGoal}>
          <Button
            sx={{ flex: 1 }}
            size="small"
            disabled={firstGoal.currentAmount >= firstGoal.targetAmount}
          >
            <PiggyBank style={{ marginRight: 4, width: 12, height: 12 }} />
            Depositar
          </Button>
        </AddDepositDialog>
      </CardActions>
    </Card>
  );
}
