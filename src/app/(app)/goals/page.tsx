// src/app/(app)/goals/page.tsx
"use client";

import { useState, useMemo, MouseEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Button,
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
  CalendarClock,
  Trophy,
} from "lucide-react";
import { useGoals } from "@/hooks/use-goals";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { AddDepositDialog } from "@/components/goals/add-deposit-dialog";
import { Goal } from "@/lib/types";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGamification } from "@/hooks/use-gamification";
import { GamificationGuide, DailyQuestsCard } from "@/components/gamification";
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
    <Box sx={{ flexGrow: 1, position: "relative", width: "100%" }}>
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        columns={{ xs: 4, sm: 8, md: 12 }}
        sx={{ width: "100%", m: 0 }}
      >
        {/* Header */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ display: { xs: "none", md: "block" } }}
              >
                Metas de Economia
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Transforme seus sonhos em realidade. Crie metas financeiras e
                acompanhe seu progresso a cada depósito.
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 1,
                width: { xs: "100%", md: "auto" },
              }}
            >
              <GamificationGuide sx={{ width: { xs: "100%", md: "auto" } }} />
              <Button
                variant="contained"
                startIcon={<PlusCircle size={18} />}
                onClick={handleCreateGoal}
                fullWidth
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                Nova Meta
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Gamification Summary for Goals */}
        {gamificationData && (
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
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
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                        color="info.main"
                      >
                        {formatCurrency(
                          goals.reduce((sum, g) => sum + g.currentAmount, 0)
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Economizado
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          </Grid>
        )}

        {/* Missões relacionadas a Metas */}
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <DailyQuestsCard pageContext="goals" compact />
        </Grid>

        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <PiggyBank size={48} style={{ opacity: 0.5 }} />
                  <Typography variant="h6">Nenhuma meta encontrada.</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    maxWidth="sm"
                  >
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
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Dialogs - MUST be outside Grid to avoid z-index conflicts */}
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
    </Box>
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Cálculo matemático da projeção (sem IA)
  const projectionResult = useMemo(() => {
    const remainingAmount = goal.targetAmount - goal.currentAmount;

    // Meta já concluída
    if (remainingAmount <= 0) {
      return { type: "completed" as const };
    }

    // Sem depósito mensal definido
    if (!goal.monthlyDeposit || goal.monthlyDeposit <= 0) {
      return { type: "no-deposit" as const };
    }

    // Calcular meses necessários
    const monthsNeeded = Math.ceil(remainingAmount / goal.monthlyDeposit);
    const projectedDate = addMonths(new Date(), monthsNeeded);

    return {
      type: "projected" as const,
      date: projectedDate,
      months: monthsNeeded,
    };
  }, [goal.targetAmount, goal.currentAmount, goal.monthlyDeposit]);

  const getProjectionText = () => {
    switch (projectionResult.type) {
      case "completed":
        return (
          <Typography variant="caption" color="success.main" fontWeight="bold">
            Meta concluída! 🎉
          </Typography>
        );
      case "no-deposit":
        return (
          <Typography variant="caption" color="text.secondary">
            Defina um depósito mensal para ver a projeção
          </Typography>
        );
      case "projected":
        return (
          <Typography variant="caption">
            Estimativa:{" "}
            <Box component="span" fontWeight="bold" textTransform="capitalize">
              {format(projectionResult.date, "MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </Box>
            {projectionResult.months && (
              <Box component="span" color="text.secondary">
                {" "}
                ({projectionResult.months}{" "}
                {projectionResult.months === 1 ? "mês" : "meses"})
              </Box>
            )}
          </Typography>
        );
    }
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
              component={CalendarClock}
              sx={{
                width: 14,
                height: 14,
                opacity: 0.7,
              }}
            />
            {getProjectionText()}
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
        sx={{ zIndex: 1300 }}
      >
        <DialogTitle>Você tem certeza?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a
            meta "{goal.name}".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
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
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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
          </Box>
        </Grid>
        <Grid size={{ xs: 4, sm: 8, md: 12 }}>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: "1fr",
              md: "1fr 1fr",
              lg: "1fr 1fr 1fr",
            }}
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
        </Grid>
      </Grid>
    </Box>
  );
}
