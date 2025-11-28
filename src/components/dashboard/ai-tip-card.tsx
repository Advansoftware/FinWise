// src/components/dashboard/ai-tip-card.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Skeleton,
  Stack,
  useTheme,
  alpha,
  keyframes,
} from "@mui/material";
import { RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { getSmartSpendingTip } from "@/services/ai-automation-service";
import { validateDataSufficiency } from "@/services/ai-cache-service";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface AITipCardProps {
  transactions: Transaction[];
}

export function AITipCard({ transactions }: AITipCardProps) {
  const [tip, setTip] = useState("");
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { user } = useAuth();
  const { isPro } = usePlan();
  const theme = useTheme();

  useEffect(() => {
    if (user && transactions) {
      validateDataSufficiency(user.uid, "spending_tip", transactions).then(
        setValidationResult
      );
    }
  }, [user, transactions]);

  const fetchTip = useCallback(
    async (forceRefresh = false) => {
      if (!user) return;

      if (!forceRefresh && validationResult && !validationResult.isValid) {
        setTip(validationResult.message);
        setHasLoaded(true);
        return;
      }

      if (transactions.length === 0 && !forceRefresh) {
        setTip("Adicione transações para receber sua primeira dica.");
        setHasLoaded(true);
        return;
      }

      startTransition(async () => {
        if (forceRefresh) setTip("");
        try {
          const newTip = await getSmartSpendingTip(
            transactions,
            user.uid,
            forceRefresh
          );
          setTip(newTip);
          setHasLoaded(true);
        } catch (error: any) {
          console.error("Error fetching or setting spending tip:", error);
          setTip(
            error.message ||
              "Não foi possível carregar a dica. Tente novamente."
          );
          setHasLoaded(true);
        }
      });
    },
    [transactions, user, validationResult]
  );

  useEffect(() => {
    if (user && isPro && !hasLoaded && validationResult?.isValid) {
      fetchTip(false);
    } else if (!hasLoaded && validationResult && !validationResult.isValid) {
      setTip(validationResult.message);
      setHasLoaded(true);
    }
  }, [user, isPro, hasLoaded, validationResult, fetchTip]);

  if (!isPro) return null;

  const showInsufficientData = validationResult && !validationResult.isValid;

  return (
    <Card
      sx={{
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: "blur(4px)",
        borderColor: showInsufficientData
          ? alpha(theme.palette.warning.main, 0.2)
          : alpha(theme.palette.primary.main, 0.2),
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            {showInsufficientData ? (
              <AlertCircle size={16} color={theme.palette.warning.main} />
            ) : (
              <Sparkles
                size={16}
                color={theme.palette.primary.main}
                style={{ animation: `${pulse} 2s ease-in-out infinite` }}
              />
            )}
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color={showInsufficientData ? "warning.main" : "primary.main"}
            >
              Dica Financeira com IA
            </Typography>
          </Stack>
        }
        subheader={
          <Typography
            variant="caption"
            sx={{
              mt: 1,
              color: showInsufficientData
                ? alpha(theme.palette.warning.main, 0.7)
                : alpha(theme.palette.primary.main, 0.7),
            }}
          >
            {showInsufficientData
              ? `Precisa de ${
                  validationResult?.requiredMinimum || 0
                } transações (você tem ${validationResult?.currentCount || 0})`
              : "Cache mensal renovado automaticamente. Atualizar custa 1 crédito."}
          </Typography>
        }
        action={
          <IconButton
            onClick={() => fetchTip(true)}
            disabled={isPending || !user}
            size="small"
            title={
              showInsufficientData
                ? "Forçar geração (pode consumir crédito)"
                : "Atualizar dica (1 crédito)"
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
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {isPending ? (
          <Stack spacing={2}>
            <Skeleton
              variant="text"
              width="100%"
              height={12}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={12}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            />
          </Stack>
        ) : (
          <Typography
            variant="body2"
            color={showInsufficientData ? "warning.dark" : "text.primary"}
          >
            {tip}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
