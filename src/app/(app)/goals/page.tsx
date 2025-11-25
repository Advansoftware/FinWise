// src/app/(app)/goals/page.tsx
"use client";

import { useState, useTransition, useEffect, useMemo, MouseEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Button,
  Stack,
  Box,
  LinearProgress,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  useTheme,
  Grid,
} from "@mui/material";
import {
  PlusCircle,
  MoreVertical,
  Trash2,
  Edit,
  Target,
  PiggyBank,
  CircleDollarSign,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useGoals } from "@/hooks/use-goals";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { AddDepositDialog } from "@/components/goals/add-deposit-dialog";
import { Goal } from "@/lib/types";
import { projectGoalCompletionAction } from "@/services/ai-actions";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProjectGoalCompletionOutput } from "@/ai/ai-types";
import { useGamification } from "@/hooks/use-gamification";
import { GamificationGuide } from "@/components/gamification";
import { formatCurrency } from "@/lib/utils";

export default function GoalsPage() {
  const { goals, isLoading, deleteGoal } = useGoals();
  const { gamificationData } = useGamification();
  const theme = useTheme();

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>(undefined);

  const handleCreateGoal = () => {
    setSelectedGoal(undefined);
    setCreateDialogOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setCreateDialogOpen(true);
  };

  const handleDeposit = (goal: Goal) => {
    setSelectedGoal(goal);
    setDepositDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setCreateDialogOpen(false);
    setDepositDialogOpen(false);
    setSelectedGoal(undefined);
  };

  const completedGoalsCount = goals.filter(
    (g) => g.currentAmount >= g.targetAmount
  ).length;

  if (isLoading) {
    return <GoalsSkeleton />;
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Metas de Economia
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Transforme seus sonhos em realidade. Crie metas financeiras e
            acompanhe seu progresso a cada depósito.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <GamificationGuide />
          <Button
            variant="contained"
            startIcon={<PlusCircle size={18} />}
            onClick={handleCreateGoal}
          >
            Nova Meta
          </Button>
        </Stack>
      </Stack>

      {/* Gamification Summary for Goals */}
      {gamificationData && (
        <Card
          sx={{
            background:
              "linear-gradient(to right, rgba(66, 32, 6, 0.3), rgba(67, 20, 7, 0.3))",
          }}
        >
          <CardHeader
            title={
              <Box display="flex" alignItems="center" gap={1}>
                <Trophy size={20} color={theme.palette.warning.main} />
                <Typography variant="h6" color="warning.light">
                  Jornada das Metas
                </Typography>
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={2} textAlign="center">
              <Grid size={{ xs: 6, md: 3 }}>
                <Box
                  p={2}
                  borderRadius={2}
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Typography variant="h5" fontWeight="bold">
                    {goals.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Metas Ativas
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Box
                  p={2}
                  borderRadius={2}
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {completedGoalsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Metas Concluídas
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Box
                  p={2}
                  borderRadius={2}
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {formatCurrency(
                      goals.reduce((sum, g) => sum + g.currentAmount, 0)
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Economizado
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Box
                  p={2}
                  borderRadius={2}
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="secondary.main"
                  >
                    {
                      gamificationData.badges.filter(
                        (b) => b.id === "finisher" || b.id === "goal-setter"
                      ).length
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Conquistas de Metas
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {goals.length > 0 ? (
        <Grid container spacing={3}>
          {goals.map((goal) => (
            <Grid key={goal.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <GoalCard
                goal={goal}
                onDelete={() => deleteGoal(goal.id)}
                onEdit={() => handleEditGoal(goal)}
                onDeposit={() => handleDeposit(goal)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Stack alignItems="center" spacing={2}>
              <PiggyBank size={48} style={{ opacity: 0.5 }} />
              <Typography variant="h6">Nenhuma meta encontrada.</Typography>
              <Typography variant="body2" color="text.secondary" maxWidth="sm">
                Crie sua primeira meta para começar a economizar. Que tal
                "Viagem de Férias" ou "Entrada do Apartamento"?
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlusCircle size={16} />}
                onClick={handleCreateGoal}
              >
                Criar Meta
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateGoalDialog
        open={createDialogOpen}
        onClose={handleCloseDialogs}
        initialData={selectedGoal}
      />

      {selectedGoal && (
        <AddDepositDialog
          open={depositDialogOpen}
          onClose={handleCloseDialogs}
          goal={selectedGoal}
        />
      )}
    </Stack>
  );
}

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
  onEdit: () => void;
  onDeposit: () => void;
}

function GoalCard({ goal, onDelete, onEdit, onDeposit }: GoalCardProps) {
  const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  const { user } = useAuth();
  const { allTransactions } = useTransactions();
  const [isProjecting, startProjecting] = useTransition();
  const [projectionResult, setProjectionResult] =
    useState<ProjectGoalCompletionOutput | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const transactionsJson = useMemo(
    () => JSON.stringify(allTransactions, null, 2),
    [allTransactions]
  );

  useEffect(() => {
    if (
      user &&
      allTransactions.length > 0 &&
      goal.currentAmount < goal.targetAmount
    ) {
      startProjecting(async () => {
        try {
          const result = await projectGoalCompletionAction(
            {
              goalName: goal.name,
              targetAmount: goal.targetAmount,
              currentAmount: goal.currentAmount,
              monthlyDeposit: goal.monthlyDeposit,
              targetDate: goal.targetDate,
              transactions: transactionsJson,
            },
            user.uid
          );
          setProjectionResult(result);
        } catch (e) {
          console.error("Projection error:", e);
          setProjectionResult({ projection: "Erro ao calcular projeção." });
        }
      });
    } else if (goal.currentAmount >= goal.targetAmount) {
      setProjectionResult({ projection: "Meta concluída!" });
    }
  }, [goal, user, allTransactions.length, transactionsJson]);

  const getProjectionText = () => {
    if (!projectionResult) return null;
    if (projectionResult.projection === "Meta concluída!") {
      return (
        <Typography variant="caption" color="success.main" fontWeight="bold">
          {projectionResult.projection}
        </Typography>
      );
    }
    if (projectionResult.completionDate) {
      const date = new Date(projectionResult.completionDate);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return (
        <Typography variant="caption">
          Estimativa:{" "}
          <Box component="span" fontWeight="bold" textTransform="capitalize">
            {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
          </Box>
        </Typography>
      );
    }
    return (
      <Typography variant="caption" textTransform="capitalize">
        {projectionResult.projection}
      </Typography>
    );
  };

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          action={
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertical size={18} />
            </IconButton>
          }
          title={
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                p={1}
                borderRadius="50%"
                bgcolor="primary.light"
                color="primary.main"
                display="flex"
              >
                <Target size={20} />
              </Box>
              <Typography variant="h6" noWrap title={goal.name}>
                {goal.name}
              </Typography>
            </Box>
          }
          sx={{ pb: 1 }}
        />
        <CardContent
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percentage, 100)}
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
            />
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="baseline"
            >
              <Typography variant="h6" fontWeight="bold">
                R$ {goal.currentAmount.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                de R$ {goal.targetAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1} minHeight={20}>
            <Box
              component={Sparkles}
              sx={{
                width: 14,
                height: 14,
                opacity: 0.7,
                animation: isProjecting
                  ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  : "none",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.5 },
                },
              }}
            />
            {isProjecting ? (
              <Typography variant="caption" color="text.secondary">
                Calculando projeção...
              </Typography>
            ) : (
              getProjectionText()
            )}
          </Box>
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PiggyBank size={16} />}
            disabled={goal.currentAmount >= goal.targetAmount}
            onClick={onDeposit}
          >
            Fazer um Depósito
          </Button>
        </CardActions>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            onDeposit();
            handleMenuClose();
          }}
        >
          <CircleDollarSign size={16} style={{ marginRight: 8 }} /> Adicionar
          Depósito
        </MenuItem>
        <MenuItem
          onClick={() => {
            onEdit();
            handleMenuClose();
          }}
        >
          <Edit size={16} style={{ marginRight: 8 }} /> Editar Meta
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <Trash2 size={16} style={{ marginRight: 8 }} /> Excluir Meta
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Você tem certeza?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a
            meta "{goal.name}".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function GoalsSkeleton() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
        <Skeleton
          variant="rectangular"
          width={120}
          height={36}
          sx={{ borderRadius: 1 }}
        />
      </Stack>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }}
        gap={3}
      >
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={250}
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>
    </Stack>
  );
}
