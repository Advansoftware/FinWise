// src/components/dashboard/future-balance-card.tsx
"use client";

import {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Skeleton,
  Box,
  Stack,
  useTheme,
  alpha,
  keyframes,
} from "@mui/material";
import { RefreshCw, TrendingUp, AlertTriangle, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import {
  getSmartFutureBalance,
  calculateFutureBalancePreview,
} from "@/services/ai-automation-service";
import { validateDataSufficiency } from "@/services/ai-cache-service";
import { PredictFutureBalanceOutput } from "@/ai/ai-types";
import { subMonths, startOfMonth } from "date-fns";
import { usePlan } from "@/hooks/use-plan";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export function FutureBalanceCard() {
  const [prediction, setPrediction] =
    useState<PredictFutureBalanceOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [useBasicCalculation, setUseBasicCalculation] = useState(false);
  const { user } = useAuth();
  const { wallets } = useWallets();
  const { budgets } = useBudgets();
  const { allTransactions } = useTransactions();
  const { isPlus } = usePlan();
  const theme = useTheme();

  const currentBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  useEffect(() => {
    if (user && allTransactions) {
      validateDataSufficiency(user.uid, "future_balance", allTransactions, {
        budgets,
      }).then((result) => {
        setValidationResult(result);
        setUseBasicCalculation(!result.isValid || allTransactions.length < 15);
      });
    }
  }, [user, allTransactions, budgets]);

  const fetchPrediction = useCallback(
    async (forceRefresh = false) => {
      if (!user) return;

      if (!forceRefresh && validationResult && !validationResult.isValid) {
        setPrediction({
          summary: validationResult.message,
          projectedEndOfMonthBalance: currentBalance,
          isRiskOfNegativeBalance: false,
        });
        return;
      }

      if (allTransactions.length === 0 && !forceRefresh) {
        setPrediction({
          summary: "Adicione transações para gerar sua primeira previsão.",
          projectedEndOfMonthBalance: currentBalance,
          isRiskOfNegativeBalance: false,
        });
        return;
      }

      startTransition(async () => {
        setPrediction(null);
        try {
          const last3MonthsStart = startOfMonth(subMonths(new Date(), 3));
          const last3MonthsTransactions = allTransactions.filter(
            (t) => new Date(t.date) >= last3MonthsStart
          );
          const recurringBills = budgets.map((b) => ({
            category: b.category,
            amount: b.amount,
          }));

          if (useBasicCalculation && !forceRefresh) {
            const basicCalc = await calculateFutureBalancePreview(
              last3MonthsTransactions,
              currentBalance,
              budgets
            );
            setPrediction({
              summary: `Com base nos seus gastos recentes (R$ ${basicCalc.averageDailySpending.toFixed(
                2
              )}/dia), você deve terminar o mês com aproximadamente R$ ${basicCalc.projectedBalance.toFixed(
                2
              )}.`,
              projectedEndOfMonthBalance: basicCalc.projectedBalance,
              isRiskOfNegativeBalance: basicCalc.isRiskOfNegativeBalance,
            });
            return;
          }

          const result = await getSmartFutureBalance(
            {
              last3MonthsTransactions: JSON.stringify(last3MonthsTransactions),
              currentBalance: currentBalance,
              recurringBills: JSON.stringify(recurringBills),
            },
            user.uid,
            forceRefresh
          );

          setPrediction(result);
        } catch (error: any) {
          console.error("Error fetching future balance prediction:", error);
          setPrediction({
            summary:
              error.message ||
              "Não foi possível carregar a previsão. Tente novamente.",
            projectedEndOfMonthBalance: 0,
            isRiskOfNegativeBalance: true,
          });
        }
      });
    },
    [
      allTransactions,
      user,
      budgets,
      currentBalance,
      validationResult,
      useBasicCalculation,
    ]
  );

  useEffect(() => {
    if (user && isPlus && validationResult !== null) {
      fetchPrediction();
    }
  }, [user, isPlus, validationResult, fetchPrediction]);

  const renderContent = () => {
    if (isPending || !prediction) {
      return (
        <Stack spacing={3} sx={{ pt: 2 }}>
          <Skeleton
            variant="text"
            width="40%"
            height={40}
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
          />
          <Skeleton
            variant="text"
            width="80%"
            height={24}
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
          />
        </Stack>
      );
    }

    return (
      <>
        <Typography
          variant="h4"
          fontWeight="bold"
          color={
            prediction.isRiskOfNegativeBalance ? "error.main" : "text.primary"
          }
        >
          R$ {(prediction.projectedEndOfMonthBalance || 0).toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {prediction.summary}
        </Typography>
      </>
    );
  };

  if (!isPlus) return null;

  const showInsufficientData = validationResult && !validationResult.isValid;

  const getIconColor = () => {
    if (showInsufficientData) return theme.palette.warning.main;
    if (prediction?.isRiskOfNegativeBalance) return theme.palette.error.main;
    if (useBasicCalculation) return theme.palette.info.main;
    return theme.palette.primary.main;
  };

  const getIconBgColor = () => {
    if (showInsufficientData) return alpha(theme.palette.warning.main, 0.2);
    if (prediction?.isRiskOfNegativeBalance)
      return alpha(theme.palette.error.main, 0.2);
    if (useBasicCalculation) return alpha(theme.palette.info.main, 0.2);
    return alpha(theme.palette.primary.main, 0.2);
  };

  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(12px)",
        borderColor: showInsufficientData
          ? alpha(theme.palette.warning.main, 0.2)
          : alpha(theme.palette.primary.main, 0.2),
      }}
    >
      <CardHeader sx={{ pb: 1.5 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: "50%",
                  bgcolor: getIconBgColor(),
                  color: getIconColor(),
                  display: "flex",
                }}
              >
                {showInsufficientData ? (
                  <AlertTriangle size={16} />
                ) : useBasicCalculation ? (
                  <Calculator size={16} />
                ) : prediction?.isRiskOfNegativeBalance ? (
                  <AlertTriangle size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Previsão de Saldo
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {useBasicCalculation
                    ? "Cálculo direto"
                    : "Projeção IA para fim do mês"}
                </Typography>
              </Box>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                pl: 4,
                display: "block",
                color: showInsufficientData
                  ? alpha(theme.palette.warning.main, 0.7)
                  : alpha(theme.palette.primary.main, 0.7),
              }}
            >
              {showInsufficientData
                ? `Precisa de ${
                    validationResult?.requiredMinimum || 0
                  } transações (você tem ${
                    validationResult?.currentCount || 0
                  })`
                : useBasicCalculation
                ? "Cache mensal. Usar IA custa 5 créditos."
                : "Cache mensal renovado. Atualizar IA custa 5 créditos."}
            </Typography>
          </Box>
          <IconButton
            onClick={() => fetchPrediction(true)}
            disabled={isPending || !user}
            size="small"
            title={
              showInsufficientData
                ? "Forçar geração (pode consumir crédito)"
                : "Atualizar com IA (5 créditos)"
            }
            sx={{
              color: alpha(theme.palette.primary.main, 0.7),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              },
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isPending ? `${spin} 1s linear infinite` : "none",
              }}
            />
          </IconButton>
        </Stack>
      </CardHeader>
      <CardContent sx={{ pt: 0 }}>{renderContent()}</CardContent>
    </Card>
  );
}
