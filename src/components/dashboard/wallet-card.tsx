
'use client';

import {Card, CardContent, CardHeader, Typography, Chip, LinearProgress, Box, Stack, useTheme, alpha} from '@mui/material';
import { Transaction } from "@/lib/types";
import { ArrowDown, ArrowUp, Wallet, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart } from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";

interface WalletCardProps {
    transactions: Transaction[];
}

export function WalletCard({ transactions }: WalletCardProps) {
    const { wallets, isLoading } = useWallets();
    const theme = useTheme();

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netFlow = totalIncome - totalExpense;
    
    // Calcular transações por dia (últimos 7 dias)
    const last7Days = new Array(7).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();
    
    const dailyExpenses = last7Days.map(date => {
        return transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(date))
            .reduce((sum, t) => sum + t.amount, 0);
    });
    
    const avgDailyExpense = dailyExpenses.reduce((sum, exp) => sum + exp, 0) / 7;
    
    // Calcular taxa de economia (receitas vs despesas)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    
    // Maior categoria de gasto
    const categoryExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryExpenses)
        .sort(([,a], [,b]) => b - a)[0];

    return (
        <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(12px)'
        }}>
            <CardHeader
                title={
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ p: 0.75, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'primary.main', display: 'flex' }}>
                            <Wallet size={16} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold">Carteira Consolidada</Typography>
                            <Typography variant="caption" color="text.secondary">Balanço total e insights</Typography>
                        </Box>
                    </Stack>
                }
                sx={{ pb: 1 }}
            />
            <CardContent sx={{ pb: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack spacing={2} sx={{ height: '100%' }}>
                    {/* Saldo Total */}
                    <Box>
                        <Typography variant="caption" color="text.secondary">Saldo Total</Typography>
                        <Typography variant="h5" fontWeight="bold" color={(totalBalance || 0) >= 0 ? "text.primary" : "error.main"}>
                            R$ {(totalBalance || 0).toFixed(2)}
                        </Typography>
                    </Box>
                    
                    {/* Receitas e Despesas */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ p: 0.5, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex' }}>
                                <ArrowDown size={12} color={theme.palette.success.main} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary" display="block">Receitas</Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main" noWrap>
                                    +R$ {(totalIncome || 0).toFixed(2)}
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ p: 0.5, borderRadius: '50%', bgcolor: alpha(theme.palette.error.main, 0.1), display: 'flex' }}>
                                <ArrowUp size={12} color={theme.palette.error.main} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary" display="block">Despesas</Typography>
                                <Typography variant="body2" fontWeight="bold" color="error.main" noWrap>
                                    -R$ {(totalExpense || 0).toFixed(2)}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                    
                    {/* Fluxo Líquido - compactado */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        p: 1, 
                        borderRadius: 1, 
                        bgcolor: 'action.hover' 
                    }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            {netFlow >= 0 ? (
                                <TrendingUp size={12} color={theme.palette.success.main} />
                            ) : (
                                <TrendingDown size={12} color={theme.palette.error.main} />
                            )}
                            <Typography variant="caption" color="text.secondary">Fluxo Líquido</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold" color={(netFlow || 0) >= 0 ? "success.main" : "error.main"}>
                            R$ {(netFlow || 0).toFixed(2)}
                        </Typography>
                    </Box>
                    
                    {/* Insights Adicionais - compactados */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <BarChart3 size={12} color={theme.palette.text.secondary} />
                                <Typography variant="caption" color="text.secondary">Gasto/Dia</Typography>
                            </Stack>
                            <Typography variant="body2" fontWeight="medium">R$ {(avgDailyExpense || 0).toFixed(2)}</Typography>
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <PieChart size={12} color={theme.palette.text.secondary} />
                                <Typography variant="caption" color="text.secondary">Taxa Economia</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography variant="body2" fontWeight="medium" color={savingsRate >= 0 ? "success.main" : "error.main"}>
                                    {savingsRate.toFixed(1)}%
                                </Typography>
                                {savingsRate >= 20 && (
                                    <Chip label="Boa!" size="small" color="secondary" sx={{ height: 16, fontSize: '0.625rem', '& .MuiChip-label': { px: 0.5 } }} />
                                )}
                            </Stack>
                        </Box>
                    </Box>
                    
                    {/* Maior Categoria - compactada e no final */}
                    {topCategory && (
                        <Box sx={{ p: 1, borderRadius: 1, border: 1, borderColor: 'divider', mt: 'auto' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                    <Typography variant="caption" color="text.secondary">Maior Gasto</Typography>
                                </Stack>
                                <Typography variant="caption" fontWeight="medium" noWrap sx={{ ml: 1 }}>{topCategory[0]}</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={totalExpense > 0 ? (topCategory[1] / totalExpense) * 100 : 0} 
                                    sx={{ flex: 1, height: 4, borderRadius: 2 }} 
                                />
                                <Typography variant="caption" fontWeight="bold" color="error.main">
                                    R$ {(topCategory[1] || 0).toFixed(2)}
                                </Typography>
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    )
}
