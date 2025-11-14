// src/components/dashboard/ai-tip-card.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { getSmartSpendingTip } from "@/services/ai-automation-service";
import { validateDataSufficiency } from "@/services/ai-cache-service";
import { Skeleton } from "../ui/skeleton";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { Box, Stack, Typography } from '@mui/material';

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

  // Valida dados quando transações mudam
  useEffect(() => {
    if (user && transactions) {
      validateDataSufficiency(user.uid, 'spending_tip', transactions).then(setValidationResult);
    }
  }, [user, transactions]);

  const fetchTip = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Se não tem dados suficientes e não está forçando, mostra mensagem
    if (!forceRefresh && validationResult && !validationResult.isValid) {
      setTip(validationResult.message);
      setHasLoaded(true);
      return;
    }

    // Se não tem transações e não está forçando
    if (transactions.length === 0 && !forceRefresh) {
      setTip("Adicione transações para receber sua primeira dica.");
      setHasLoaded(true);
      return;
    }

    startTransition(async () => {
        if (forceRefresh) setTip(""); // Clear previous tip only on refresh
        try {
            const newTip = await getSmartSpendingTip(transactions, user.uid, forceRefresh);
            setTip(newTip);
            setHasLoaded(true);
        } catch (error: any) {
            console.error("Error fetching or setting spending tip:", error);
            setTip(error.message || "Não foi possível carregar a dica. Tente novamente.");
            setHasLoaded(true);
        }
    });
  }, [transactions, user, validationResult]);

  // Carrega automaticamente quando há dados suficientes
  useEffect(() => {
    if (user && isPro && !hasLoaded && validationResult?.isValid) {
      fetchTip(false); // Sempre false para não consumir créditos no carregamento inicial
    } else if (!hasLoaded && validationResult && !validationResult.isValid) {
      setTip(validationResult.message);
      setHasLoaded(true);
    }
  }, [user, isPro, hasLoaded, validationResult, fetchTip]);

  if (!isPro) return null;

  const showInsufficientData = validationResult && !validationResult.isValid;

  return (
    <Card sx={{ 
      bgcolor: 'rgba(var(--card-rgb), 0.5)', 
      backdropFilter: 'blur(4px)',
      borderColor: showInsufficientData ? 'rgba(245, 158, 11, 0.2)' : 'rgba(var(--primary-rgb), 0.2)'
    }}>
      <CardHeader sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', pb: 2, p: 4 }}>
        <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                {showInsufficientData ? (
                  <AlertCircle style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                ) : (
                  <Sparkles style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} className="animate-pulse" />
                )}
                <CardTitle>
                  <Typography component="span" sx={{ fontSize: '0.875rem', color: showInsufficientData ? '#f59e0b' : 'rgba(var(--primary-rgb), 0.9)' }}>
                    Dica Financeira com IA
                  </Typography>
                </CardTitle>
            </Stack>
            <CardDescription>
              <Typography component="span" sx={{ fontSize: '0.75rem', mt: 1, color: showInsufficientData ? 'rgba(245, 158, 11, 0.7)' : 'rgba(var(--primary-rgb), 0.7)' }}>
                {showInsufficientData 
                  ? `Precisa de ${validationResult?.requiredMinimum || 0} transações (você tem ${validationResult?.currentCount || 0})`
                  : "Cache mensal renovado automaticamente. Atualizar custa 1 crédito."
                }
              </Typography>
            </CardDescription>
        </Box>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchTip(true)}
            disabled={isPending || !user}
            sx={{ 
              color: 'rgba(var(--primary-rgb), 0.7)', 
              '&:hover': { bgcolor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' },
              borderRadius: '50%',
              height: '1.75rem',
              width: '1.75rem'
            }}
            title={showInsufficientData ? "Forçar geração (pode consumir crédito)" : "Atualizar dica (1 crédito)"}
        >
            <RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} className={isPending ? "animate-spin" : ""} />
        </Button>
      </CardHeader>
      <CardContent sx={{ p: 4, pt: 0 }}>
        {isPending ? (
           <Stack spacing={2}>
            <Skeleton sx={{ height: '0.75rem', width: '100%', bgcolor: 'rgba(var(--primary-rgb), 0.1)' }} />
            <Skeleton sx={{ height: '0.75rem', width: '80%', bgcolor: 'rgba(var(--primary-rgb), 0.1)' }} />
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: showInsufficientData ? (theme => theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706') : 'rgba(var(--foreground-rgb), 0.9)' }}>
            {tip}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
