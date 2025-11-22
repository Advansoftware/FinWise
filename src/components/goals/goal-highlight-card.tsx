// src/components/goals/goal-highlight-card.tsx
'use client';

// Função temporária cn
const cn = (...classes: (string | boolean | undefined | Record<string, boolean>)[]) => classes.map(c => typeof c === 'object' ? Object.keys(c).filter(k => c[k]).join(' ') : c).filter(Boolean).join(' ');
import { useGoals } from "@/hooks/use-goals";
import { Card, CardHeader, CardContent, Typography, CardActions, Button, LinearProgress, Box, Stack } from '@mui/material';
import { Skeleton } from "@/components/mui-wrappers/skeleton";
import { Target, PiggyBank, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AddDepositDialog } from "./add-deposit-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import { useState, useEffect, useTransition, useMemo } from "react";
import { getSmartGoalPrediction } from "@/services/ai-automation-service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProjectGoalCompletionOutput } from "@/ai/ai-types";


export function GoalHighlightCard() {
    const { goals, isLoading: isGoalsLoading } = useGoals();
    const { allTransactions, isLoading: isTxLoading } = useTransactions();
    const { user } = useAuth();
    const [isProjecting, startProjecting] = useTransition();
    const [projectionResult, setProjectionResult] = useState<ProjectGoalCompletionOutput | null>(null);
    const [hasLoadedProjection, setHasLoadedProjection] = useState(false);

    const isLoading = isGoalsLoading || isTxLoading;

    const firstGoal = useMemo(() => {
        if (!goals || goals.length === 0) return null;
        // Prioritize the goal that is not yet completed
        return goals.find(g => g.currentAmount < g.targetAmount) || goals[0];
    }, [goals]);

    const transactionsJson = useMemo(() => JSON.stringify(allTransactions, null, 2), [allTransactions]);

    // Carrega projeção usando sistema inteligente
    useEffect(() => {
        if (user && firstGoal && firstGoal.currentAmount < firstGoal.targetAmount && !hasLoadedProjection) {
            startProjecting(async () => {
                 try {
                    const result = await getSmartGoalPrediction(firstGoal.id, {
                        goalName: firstGoal.name,
                        targetAmount: firstGoal.targetAmount,
                        currentAmount: firstGoal.currentAmount,
                        targetDate: firstGoal.targetDate,
                        monthlyDeposit: firstGoal.monthlyDeposit,
                        transactions: transactionsJson,
                    }, user.uid);
                    setProjectionResult(result);
                    setHasLoadedProjection(true);
                } catch (e) {
                    console.error("Projection error:", e);
                    setProjectionResult({ projection: "Erro ao calcular." });
                    setHasLoadedProjection(true);
                }
            });
        } else if (firstGoal && firstGoal.currentAmount >= firstGoal.targetAmount && !hasLoadedProjection) {
            setProjectionResult({ projection: "Meta concluída!" });
            setHasLoadedProjection(true);
        }
    }, [firstGoal, user, hasLoadedProjection, transactionsJson]);

    // Função para refresh manual da projeção
    const refreshProjection = () => {
        if (!user || !firstGoal) return;
        
        setHasLoadedProjection(false);
        startProjecting(async () => {
            try {
                const result = await getSmartGoalPrediction(firstGoal.id, {
                    goalName: firstGoal.name,
                    targetAmount: firstGoal.targetAmount,
                    currentAmount: firstGoal.currentAmount,
                    targetDate: firstGoal.targetDate,
                    monthlyDeposit: firstGoal.monthlyDeposit,
                    transactions: transactionsJson,
                }, user.uid, true); // forceRefresh = true
                setProjectionResult(result);
                setHasLoadedProjection(true);
            } catch (e) {
                console.error("Projection error:", e);
                setProjectionResult({ projection: "Erro ao calcular." });
                setHasLoadedProjection(true);
            }
        });
    };


    if (isLoading) {
        return (
            <Card>
                <CardHeader sx={{ pb: 1 }}>
                    <Typography variant="h6">
                      <Typography component="span" sx={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PiggyBank style={{ width: '1rem', height: '1rem' }} />
                        <span>Metas</span>
                      </Typography>
                    </Typography>
                </CardHeader>
                <CardContent sx={{ pb: 1.5 }}>
                    <Stack spacing={1}>
                        <Skeleton sx={{ height: 16, width: '75%' }} />
                        <Skeleton sx={{ height: 12, width: '100%' }} />
                        <Skeleton sx={{ height: 8, width: '100%' }} />
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    if (!firstGoal) {
        return (
             <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 2 }}>
                <Target style={{ width: '2rem', height: '2rem', color: 'rgba(var(--primary-rgb), 0.7)', marginBottom: '0.5rem' }}/>
                <Typography variant="h6">
                  <Typography component="span" sx={{ fontSize: '1rem' }}>Crie sua Primeira Meta</Typography>
                </Typography>
                <CardContent sx={{ p: 0, mt: 0.5, mb: 1.5 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      Comece a economizar para seus sonhos.
                    </Typography>
                </CardContent>
                <Button size="small">
                    <Link href="/goals">Criar Meta</Link>
                </Button>
            </Card>
        )
    }

    const percentage = Math.round((firstGoal.currentAmount / firstGoal.targetAmount) * 100);
    
    const getProjectionText = () => {
        if (!projectionResult) return null;
        if (projectionResult.projection === "Meta concluída!") {
            return <Typography component="span" sx={{ color: '#10b981', fontWeight: 600 }}>{projectionResult.projection}</Typography>
        }
        if (projectionResult.completionDate) {
            const date = new Date(projectionResult.completionDate);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            return (
              <Typography component="span">
                Estimativa: <Typography component="span" sx={{ fontWeight: 600, color: 'rgba(var(--foreground-rgb), 0.8)', textTransform: 'capitalize' }}>
                  {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
                </Typography>
              </Typography>
            )
        }
        return <Typography component="span" sx={{ textTransform: 'capitalize' }}>{projectionResult.projection}</Typography>
    }

    return (
        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <CardHeader sx={{ pb: 1, flexShrink: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ p: 0.5, borderRadius: '50%', bgcolor: 'rgba(var(--primary-rgb), 0.2)' }}>
                        <Target style={{ width: '0.75rem', height: '0.75rem', color: 'var(--primary)' }}/>
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                         <Typography variant="h6">
                           <Typography component="span" sx={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                             {firstGoal.name}
                           </Typography>
                         </Typography>
                         <Typography variant="body2" color="text.secondary">
                           <Typography component="span" sx={{ fontSize: '0.75rem' }}>Sua meta em destaque</Typography>
                         </Typography>
                    </Box>
                </Stack>
            </CardHeader>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 1.5, flex: 1 }}>
                <LinearProgress variant="determinate" value={Math.min(percentage, 100)} sx={{ height: 6 }} />
                 <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
                      R$ {firstGoal.currentAmount.toFixed(2)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      de R$ {firstGoal.targetAmount.toFixed(2)}
                    </Typography>
                </Stack>
                 <Stack 
                   direction="row" 
                   alignItems="center" 
                   spacing={0.5} 
                   justifyContent="space-between"
                   sx={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}
                 >
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                        <Sparkles 
                          style={{ width: '0.75rem', height: '0.75rem', color: 'rgba(var(--primary-rgb), 0.8)' }}
                          className={"flex-shrink-0", isProjecting && "animate-pulse"} 
                        />
                         <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                         {isProjecting ? (
                            "Calculando..."
                        ) : (
                           getProjectionText()
                        )}
                         </Box>
                    </Stack>
                    {projectionResult && !isProjecting && (
                        <Button 
                            variant="text" 
                            size="small" 
                            sx={{ height: 16, width: 16, p: 0, minWidth: 16, color: 'var(--muted-foreground)', '&:hover': { color: 'var(--primary)' }, flexShrink: 0 }}
                            onClick={refreshProjection}
                            title="Atualizar previsão"
                        >
                            <RefreshCw style={{ width: '0.75rem', height: '0.75rem' }} />
                        </Button>
                    )}
                </Stack>
            </CardContent>
             <CardActions sx={{ display: 'flex', gap: 1, p: 2, pt: 0, flexShrink: 0 }}>
                 <Button variant="outlined" sx={{ flex: 1 }} size="small">
                    <Link href="/goals">Ver Todas</Link>
                 </Button>
                  <AddDepositDialog goal={firstGoal}>
                    <Button sx={{ flex: 1 }} size="small" disabled={firstGoal.currentAmount >= firstGoal.targetAmount}>
                        <PiggyBank style={{ marginRight: '0.25rem', width: '0.75rem', height: '0.75rem' }}/>Depositar
                    </Button>
                </AddDepositDialog>
             </CardActions>
        </Card>
    )
}
