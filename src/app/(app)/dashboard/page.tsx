// src/app/(app)/dashboard/page.tsx
"use client";

import { Button, Stack, Box, Typography, Skeleton, Grid } from "@mui/material";
import { PlusCircle, ScanLine } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ItemFilter } from "@/components/dashboard/item-filter";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { AITipCard } from "@/components/dashboard/ai-tip-card";
import { AddTransactionSheet } from "@/components/dashboard/add-transaction-sheet";
import { ScanQRCodeDialog } from "@/components/dashboard/scan-qr-code-dialog";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { GoalHighlightCard } from "@/components/goals/goal-highlight-card";
import { FutureBalanceCard } from "@/components/dashboard/future-balance-card";
import { GamificationGuide } from "@/components/gamification";
import { usePlan } from "@/hooks/use-plan";

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
    setSelectedSubcategory,
  } = useTransactions();
  const { isPro, isPlus } = usePlan();

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      {/* Header - Mobile First */}
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: "1.5rem", sm: "1.875rem" },
                fontWeight: "bold",
                letterSpacing: "-0.025em",
              }}
            >
              Painel
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              Aqui está uma visão geral das suas finanças.
            </Typography>
          </Box>

          {/* Action Buttons - Alinhados à direita */}
          <Stack direction="row" spacing={1.5}>
            <GamificationGuide />
            {isPro && (
              <ScanQRCodeDialog>
                <Button variant="outlined" startIcon={<ScanLine size={18} />}>
                  Escanear QRCode
                </Button>
              </ScanQRCodeDialog>
            )}
            <AddTransactionSheet>
              <Button variant="contained" startIcon={<PlusCircle size={18} />}>
                Nova Transação
              </Button>
            </AddTransactionSheet>
          </Stack>
        </Stack>
      </Stack>

      {/* Filters - Todos com mesmo estilo */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <DateRangePicker initialDate={dateRange} onUpdate={setDateRange} />
        <ItemFilter
          placeholder="Todas as Categorias"
          items={["all", ...categories]}
          selectedItem={selectedCategory}
          onItemSelected={handleCategoryChange}
        />
        <ItemFilter
          placeholder="Todas as Subcategorias"
          items={["all", ...availableSubcategories]}
          selectedItem={selectedSubcategory}
          onItemSelected={setSelectedSubcategory}
          disabled={selectedCategory === "all"}
        />
      </Stack>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <Stack spacing={{ xs: 2, sm: 3 }}>
          {/* Stats Cards - Sempre full width, 4 cards em linha no desktop */}
          <StatsCards transactions={filteredTransactions} />

          {/* Main Content Grid */}
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Coluna Principal - 8 colunas no desktop */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                {/* Spending Chart */}
                <SpendingChart data={chartData} />

                {/* Recent Transactions */}
                <RecentTransactions transactions={filteredTransactions} />
              </Stack>
            </Grid>

            {/* Coluna Lateral - 4 colunas no desktop */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                {/* Wallet Summary */}
                <WalletCard transactions={filteredTransactions} />

                {/* AI Tip */}
                {isPro && <AITipCard transactions={filteredTransactions} />}

                {/* Goal Highlight Card */}
                <GoalHighlightCard />

                {/* Future Balance Card */}
                {isPlus && <FutureBalanceCard />}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}

function DashboardSkeleton() {
  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
      </Grid>
    </Grid>
  );
}
