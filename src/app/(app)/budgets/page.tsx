// src/app/(app)/budgets/page.tsx
"use client";

import { useState, MouseEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stack,
  Box,
  Tabs,
  Tab,
  LinearProgress,
  Skeleton,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  useTheme,
} from "@mui/material";
import {
  PlusCircle,
  MoreVertical,
  Trash2,
  Edit,
  PiggyBank,
  Trophy,
  Flame,
  Award,
  Calculator,
  BarChart3,
} from "lucide-react";
import { useBudgets } from "@/hooks/use-budgets";
import { formatCurrency } from "@/lib/utils";
import { CreateBudgetDialog } from "@/components/budgets/create-budget-dialog";
import { Budget } from "@/lib/types";
import { AutomaticBudgetCard } from "@/components/budgets/automatic-budget-card";
import { BudgetGuidance } from "@/components/budgets/budget-guidance";
import { SpendingAnalysis } from "@/components/budgets/spending-analysis";
import { usePlan } from "@/hooks/use-plan";
import { useGamification } from "@/hooks/use-gamification";
import { useToast } from "@/hooks/use-toast";

export default function BudgetsPage() {
  const { budgets, isLoading, deleteBudget, addBudget } = useBudgets();
  const { isPlus } = usePlan();
  const { gamificationData } = useGamification();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("budgets");

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return <BudgetsSkeleton />;
  }

  const handleBudgetCreation = async (budgetData: any) => {
    try {
      await addBudget({
        ...budgetData,
        period: "monthly" as const,
      });
      toast({
        title: "Orçamento criado",
        description: `Orçamento para ${budgetData.category} foi criado com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Erro ao criar orçamento",
        description: "Não foi possível criar o orçamento. Tente novamente.",
      });
    }
  };

  const handleMultipleBudgetCreation = async (budgetPlans: any[]) => {
    try {
      for (const plan of budgetPlans) {
        await addBudget({
          name: plan.name,
          category: plan.category,
          amount: plan.amount,
          period: "monthly" as const,
        });
      }
      toast({
        title: "Orçamentos criados",
        description: `${budgetPlans.length} orçamentos foram criados com sucesso.`,
      });
      setActiveTab("budgets");
    } catch (error) {
      toast({
        variant: "error",
        title: "Erro ao criar orçamentos",
        description:
          "Não foi possível criar alguns orçamentos. Tente novamente.",
      });
    }
  };

  const handleSuggestionAccepted = async (category: string, amount: number) => {
    await handleBudgetCreation({
      name: `Orçamento ${category}`,
      category,
      amount,
    });
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Orçamentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Defina limites de gastos mensais para suas categorias e evite
            surpresas no final do mês.
          </Typography>
        </Box>
        <CreateBudgetDialog>
          <Button variant="contained" startIcon={<PlusCircle size={18} />}>
            Novo Orçamento
          </Button>
        </CreateBudgetDialog>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="budget tabs"
        >
          <Tab
            label="Meus Orçamentos"
            value="budgets"
            icon={<PiggyBank size={18} />}
            iconPosition="start"
          />
          <Tab
            label="Como Montar"
            value="guidance"
            icon={<Calculator size={18} />}
            iconPosition="start"
          />
          <Tab
            label="Análise dos Gastos"
            value="analysis"
            icon={<BarChart3 size={18} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {activeTab === "budgets" && (
        <Stack spacing={3}>
          {gamificationData && (
            <Card
              sx={{
                background: "linear-gradient(to right, #eff6ff, #f0fdf4)",
                ".dark &": {
                  background:
                    "linear-gradient(to right, rgba(23, 37, 84, 0.2), rgba(20, 83, 45, 0.2))",
                },
              }}
            >
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Trophy size={20} />
                    <Typography variant="h6">
                      Desempenho dos Orçamentos
                    </Typography>
                  </Box>
                }
                titleTypographyProps={{ color: "primary.main" }}
              />
              <CardContent>
                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }}
                  gap={2}
                  textAlign="center"
                >
                  <Box p={2} bgcolor="background.paper" borderRadius={1}>
                    <Typography variant="h5" fontWeight="bold">
                      {budgets.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Orçamentos Ativos
                    </Typography>
                  </Box>
                  <Box p={2} bgcolor="background.paper" borderRadius={1}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {gamificationData.achievements.find(
                        (a) => a.id === "budget-master"
                      )?.progress || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Orçamentos Cumpridos
                    </Typography>
                  </Box>
                  <Box p={2} bgcolor="background.paper" borderRadius={1}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="error.main"
                    >
                      {gamificationData.achievements.find(
                        (a) => a.id === "overspending-avoider"
                      )?.progress || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Orçamentos Estourados
                    </Typography>
                  </Box>
                  <Box p={2} bgcolor="background.paper" borderRadius={1}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="warning.main"
                      display="flex"
                      alignItems="center"
                      justifyItems="center"
                      justifyContent="center"
                      gap={0.5}
                    >
                      <Flame size={20} /> {gamificationData.streak || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Meses no Controle
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {isPlus && <AutomaticBudgetCard />}

          {budgets.length > 0 ? (
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                md: "1fr 1fr",
                lg: "1fr 1fr 1fr",
              }}
              gap={3}
            >
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onDelete={() => deleteBudget(budget.id)}
                />
              ))}
            </Box>
          ) : (
            <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
              <CardContent>
                <Stack alignItems="center" spacing={2} py={4}>
                  <PiggyBank size={48} style={{ opacity: 0.5 }} />
                  <Typography variant="h6">
                    Nenhum orçamento encontrado.
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    maxWidth="sm"
                  >
                    Experimente usar nossas ferramentas inteligentes para criar
                    orçamentos baseados na sua situação ou histórico de gastos.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveTab("guidance")}
                      startIcon={<Calculator size={16} />}
                    >
                      Como Montar
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveTab("analysis")}
                      startIcon={<BarChart3 size={16} />}
                    >
                      Analisar Gastos
                    </Button>
                    <CreateBudgetDialog>
                      <Button
                        variant="contained"
                        startIcon={<PlusCircle size={16} />}
                      >
                        Criar Manual
                      </Button>
                    </CreateBudgetDialog>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {activeTab === "guidance" && (
        <BudgetGuidance onBudgetCreated={handleMultipleBudgetCreation} />
      )}

      {activeTab === "analysis" && (
        <SpendingAnalysis
          onBudgetSuggestionAccepted={handleSuggestionAccepted}
        />
      )}
    </Stack>
  );
}

function BudgetCard({
  budget,
  onDelete,
}: {
  budget: Budget;
  onDelete: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const percentage = Math.round((budget.currentSpending / budget.amount) * 100);

  let progressColor: "primary" | "secondary" | "error" | "warning" | "success" =
    "primary";
  if (percentage > 100) progressColor = "error";
  else if (percentage > 80) progressColor = "warning";

  const remainingAmount = budget.amount - budget.currentSpending;

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            {budget.currentSpending <= budget.amount && (
              <Box
                component={Award}
                sx={{ width: 16, height: 16, color: "warning.main" }}
              />
            )}
            <Typography variant="h6">{budget.name}</Typography>
          </Box>
        }
        subheader={`Categoria: ${budget.category}`}
        action={
          <>
            <IconButton onClick={handleMenuClick} size="small">
              <MoreVertical size={16} />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
              <CreateBudgetDialog initialData={budget}>
                <MenuItem onClick={handleMenuClose}>
                  <Edit size={16} style={{ marginRight: 8 }} /> Editar
                </MenuItem>
              </CreateBudgetDialog>
              <MenuItem
                onClick={handleDeleteClick}
                sx={{ color: "error.main" }}
              >
                <Trash2 size={16} style={{ marginRight: 8 }} /> Excluir
                Orçamento
              </MenuItem>
            </Menu>
          </>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentage, 100)}
            color={progressColor}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="baseline"
          >
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(budget.currentSpending)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              de {formatCurrency(budget.amount)}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography
              variant="body2"
              fontWeight="bold"
              color={remainingAmount >= 0 ? "success.main" : "error.main"}
            >
              {remainingAmount >= 0
                ? `${formatCurrency(remainingAmount)} restantes`
                : `${formatCurrency(
                    Math.abs(remainingAmount)
                  )} acima do limite`}
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Você tem certeza?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o
            orçamento "{budget.name}".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

function BudgetsSkeleton() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <Skeleton width={200} height={40} />
          <Skeleton width={300} height={20} />
        </Box>
        <Skeleton width={150} height={40} />
      </Stack>
      <Skeleton variant="rectangular" height={100} />
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr 1fr" }}
        gap={3}
      >
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="rectangular" height={200} />
      </Box>
    </Stack>
  );
}
