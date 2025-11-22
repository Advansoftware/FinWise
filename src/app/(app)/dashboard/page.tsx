
// src/app/(app)/dashboard/page.tsx
'use client';

import { Button, Grid, Stack, Box, Typography, Skeleton, useTheme, useMediaQuery } from "@mui/material";
import { PlusCircle, ScanLine } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { ReceiptScannerDialog } from "@/components/receipts/receipt-scanner-dialog";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { GoalHighlightCard } from "@/components/goals/goal-highlight-card";
import { FutureBalanceCard } from "@/components/dashboard/future-balance-card";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeButton } from "@/components/pro-upgrade-button";
import { InstallmentsSummaryCard } from "@/components/dashboard/installments-summary-card";
import { GamificationSummary } from "@/components/profile/gamification-summary";

export default function DashboardPage() {
    const { 
        isLoading, 
        filteredTransactions,
        chartData,
        dateRange, 
        setDateRange,
        categories,
        handleCategoryChange,
        selectedCategory,
        availableSubcategories,
        selectedSubcategory,
        setSelectedSubcategory
    } = useTransactions();
    const { isPro, isPlus } = usePlan();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Stack spacing={{ xs: 2, sm: 3 }}>
            {/* Header */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>Painel</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Aqui está uma visão geral das suas finanças.
                    </Typography>
                </Box>
                
                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <ProUpgradeButton requiredPlan="Pro">
                       <ReceiptScannerDialog>
                           <Button 
                               variant="outlined" 
                               disabled={!isPro}
                               fullWidth={isMobile}
                               startIcon={<ScanLine size={18} />}
                           >
                                Escanear Nota
                            </Button>
                        </ReceiptScannerDialog>
                    </ProUpgradeButton>
                    
                    <AddTransactionSheet>
                        <Button 
                            variant="contained" 
                            fullWidth={isMobile}
                            startIcon={<PlusCircle size={18} />}
                        >
                            Adicionar Transação
                        </Button>
                    </AddTransactionSheet>
                </Stack>
            </Stack>

            {/* Filters */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
               <DateRangePicker 
                    initialDate={dateRange} 
                    onUpdate={setDateRange}
                    className="w-full md:w-auto"
                />
                <Box sx={{ flex: 1, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <ItemFilter 
                        placeholder="Todas as Categorias"
                        items={['all', ...categories]} 
                        selectedItem={selectedCategory} 
                        onItemSelected={handleCategoryChange}
                        className="w-full sm:flex-1"
                    />
                    <ItemFilter 
                        placeholder="Todas as Subcategorias"
                        items={['all', ...availableSubcategories]} 
                        selectedItem={selectedSubcategory} 
                        onItemSelected={setSelectedSubcategory}
                        disabled={selectedCategory === 'all'}
                        className="w-full sm:flex-1"
                    />
                </Box>
            </Stack>

            {isLoading ? <DashboardSkeleton /> : (
                <>
                    {/* Main Grid */}
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                        {/* Left Side - Wallet Card and Gamification */}
                        <Grid xs={12} lg={6}>
                           <Grid container spacing={{ xs: 2, sm: 3 }}>
                               <Grid xs={12} sm={6}>
                                   <WalletCard transactions={filteredTransactions} />
                               </Grid>
                               <Grid xs={12} sm={6}>
                                   {isPro && <GamificationSummary />}
                               </Grid>
                           </Grid>
                        </Grid>
                        
                        {/* Right Side - Goals, Installments, and Future Balance */}
                        <Grid xs={12} lg={6}>
                            <Stack spacing={{ xs: 2, sm: 3 }}>
                                <Grid container spacing={{ xs: 2, sm: 3 }}>
                                    <Grid xs={12} sm={6}>
                                        <GoalHighlightCard />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <InstallmentsSummaryCard />
                                    </Grid>
                                </Grid>
                                
                                {isPlus ? (
                                    <FutureBalanceCard />
                                ) : (
                                    <Box sx={{ position: 'relative' }}>
                                        <FutureBalanceCard />
                                        <Box sx={{ 
                                            position: 'absolute', 
                                            inset: 0, 
                                            bgcolor: 'rgba(255, 255, 255, 0.8)', 
                                            backdropFilter: 'blur(4px)', 
                                            borderRadius: 2, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            zIndex: 1
                                        }}>
                                            <Box sx={{ textAlign: 'center', p: 3, maxWidth: 300 }}>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>Previsão de Saldo Plus</Typography>
                                                <Typography variant="body2" color="text.secondary" paragraph>
                                                    Desbloqueie previsões inteligentes do seu saldo futuro com IA
                                                </Typography>
                                                <ProUpgradeButton requiredPlan="Plus">
                                                    <Button variant="contained" fullWidth>
                                                        Fazer Upgrade para Plus
                                                    </Button>
                                                </ProUpgradeButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>

                    {/* Stats Cards */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, sm: 3 } }}>
                        <StatsCards transactions={filteredTransactions} />
                    </Box>

                    {/* Chart and Recent Transactions */}
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                       <Grid xs={12} lg={8} order={{ xs: 2, lg: 1 }}>
                         <SpendingChart data={chartData} />
                       </Grid>
                       <Grid xs={12} lg={4} order={{ xs: 1, lg: 2 }}>
                         <RecentTransactions transactions={filteredTransactions} />
                       </Grid>
                    </Grid>

                    {isPro && <AITipCard transactions={filteredTransactions} />}
                </>
            )}
        </Stack>
    );
}

function DashboardSkeleton() {
    return (
        <Stack spacing={{ xs: 2, sm: 3 }}>
             {/* Main Grid Skeleton */}
             <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Left Side */}
                <Grid xs={12} lg={6}>
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                        <Grid xs={12} sm={6}>
                            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                        </Grid>
                    </Grid>
                </Grid>
                
                {/* Right Side */}
                <Grid xs={12} lg={6}>
                    <Stack spacing={{ xs: 2, sm: 3 }}>
                        <Grid container spacing={{ xs: 2, sm: 3 }}>
                            <Grid xs={12} sm={6}>
                                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                            </Grid>
                            <Grid xs={12} sm={6}>
                                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                            </Grid>
                        </Grid>
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                    </Stack>
                </Grid>
             </Grid>

             {/* Stats Cards Skeleton */}
            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {[1, 2, 3, 4].map((i) => (
                    <Grid xs={12} sm={6} lg={3} key={i}>
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>

            {/* Chart and Recent Transactions Skeleton */}
            <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid xs={12} lg={8} order={{ xs: 2, lg: 1 }}>
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                </Grid>
                <Grid xs={12} lg={4} order={{ xs: 1, lg: 2 }}>
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                </Grid>
            </Grid>

            {/* AI Tip Skeleton */}
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
        </Stack>
    );
}
